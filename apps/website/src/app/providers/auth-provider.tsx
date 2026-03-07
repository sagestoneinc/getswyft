import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Provider, Session, User as SupabaseUser } from "@supabase/supabase-js";
import Keycloak from "keycloak-js";
import { apiClient } from "../lib/api-client";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";

type AuthUser = {
  sub?: string;
  email?: string;
  name?: string;
};

type LoginCredentials = {
  email: string;
  password: string;
};

export type SocialAuthProvider = "google" | "azure";

type AuthContextValue = {
  provider: "keycloak" | "supabase";
  supportsPasswordAuth: boolean;
  supportsSocialAuth: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  roles: string[];
  permissions: string[];
  can: (permission: string) => boolean;
  login: (targetPath?: string, credentials?: LoginCredentials) => Promise<void>;
  loginWithSocialProvider: (socialProvider: SocialAuthProvider, targetPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const configuredProvider = import.meta.env.VITE_AUTH_PROVIDER as string | undefined;
const authProvider: "keycloak" | "supabase" =
  configuredProvider === "keycloak" || configuredProvider === "supabase"
    ? configuredProvider
    : isSupabaseConfigured()
      ? "supabase"
      : "keycloak";
const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL as string | undefined;
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM as string | undefined;
const keycloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string | undefined;
const devBypass = (import.meta.env.VITE_DEV_AUTH_BYPASS as string | undefined)?.toLowerCase() === "true";

function mapKeycloakTokenToUser(tokenParsed: Keycloak.KeycloakTokenParsed | undefined): AuthUser | null {
  if (!tokenParsed) {
    return null;
  }

  return {
    sub: tokenParsed.sub,
    email: tokenParsed.email,
    name: tokenParsed.name || tokenParsed.preferred_username,
  };
}

function mapSupabaseUser(user: SupabaseUser | null | undefined): AuthUser | null {
  if (!user) {
    return null;
  }

  return {
    sub: user.id,
    email: user.email,
    name:
      (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      user.email ||
      user.id,
  };
}

function buildDevUser(): AuthUser {
  return {
    sub: "dev|local-user",
    email: "admin@getswyft.local",
    name: "Local Admin",
  };
}

async function signInWithSupabaseOAuth(socialProvider: SocialAuthProvider, targetPath = "/app") {
  const supabase = getSupabaseClient();
  const redirectTo = `${window.location.origin}${targetPath}`;
  const options =
    socialProvider === "google"
      ? {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        }
      : {
          redirectTo,
          scopes: "email",
        };

  const { error } = await supabase.auth.signInWithOAuth({
    provider: socialProvider as Provider,
    options,
  });

  if (error) {
    throw error;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const keycloakRef = useRef<Keycloak | null>(null);

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | undefined;

    async function loadAccessContext() {
      try {
        const response = await apiClient.get<{
          ok: boolean;
          user: {
            externalAuthId: string;
            email: string;
            displayName: string | null;
          };
          roles: string[];
          permissions: string[];
        }>("/v1/auth/me");

        if (!mounted) {
          return;
        }

        setRoles(response.roles || []);
        setPermissions(response.permissions || []);
        setUser((currentUser) => ({
          sub: currentUser?.sub || response.user.externalAuthId,
          email: response.user.email,
          name: response.user.displayName || currentUser?.name || response.user.email,
        }));
      } catch (error) {
        if (!mounted) {
          return;
        }

        setRoles([]);
        setPermissions([]);
        console.warn("Failed to load auth access context", error);
      }
    }

    async function applyDevBypass() {
      apiClient.setAccessTokenProvider(async () => null);
      if (!mounted) {
        return;
      }

      setIsAuthenticated(true);
      setUser(buildDevUser());
      await loadAccessContext();
      setIsLoading(false);
    }

    async function applySupabaseSession(session: Session | null) {
      apiClient.setAccessTokenProvider(async () => {
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || null;
      });

      if (!mounted) {
        return;
      }

      setIsAuthenticated(Boolean(session));
      setUser(mapSupabaseUser(session?.user || null));

      if (session || devBypass) {
        await loadAccessContext();
      } else {
        setRoles([]);
        setPermissions([]);
      }

      setIsLoading(false);
    }

    async function initSupabase() {
      if (!isSupabaseConfigured()) {
        if (devBypass) {
          await applyDevBypass();
          return;
        }

        throw new Error("Supabase environment variables are not configured");
      }

      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await applySupabaseSession(session);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        void applySupabaseSession(nextSession);
      });

      cleanup = () => {
        subscription.unsubscribe();
      };
    }

    async function initKeycloak() {
      if (!keycloakUrl || !keycloakRealm || !keycloakClientId) {
        if (devBypass) {
          await applyDevBypass();
          return;
        }

        throw new Error("Keycloak environment variables are not configured");
      }

      const keycloak = new Keycloak({
        url: keycloakUrl,
        realm: keycloakRealm,
        clientId: keycloakClientId,
      });

      keycloakRef.current = keycloak;

      const authenticated = await keycloak.init({
        onLoad: "check-sso",
        checkLoginIframe: false,
        pkceMethod: "S256",
      });

      if (!mounted) {
        return;
      }

      setIsAuthenticated(authenticated);
      setUser(mapKeycloakTokenToUser(keycloak.tokenParsed));

      apiClient.setAccessTokenProvider(async () => {
        if (!keycloak.authenticated) {
          return null;
        }

        await keycloak.updateToken(30);
        return keycloak.token || null;
      });

      if (authenticated || devBypass) {
        await loadAccessContext();
      } else {
        setRoles([]);
        setPermissions([]);
      }

      setIsLoading(false);
    }

    const init = authProvider === "supabase" ? initSupabase : initKeycloak;

    init().catch(async (error) => {
      if (!mounted) {
        return;
      }

      if (devBypass) {
        await applyDevBypass();
      }

      setIsLoading(false);
      if (!devBypass) {
        console.error(error);
      }
    });

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      provider: authProvider,
      supportsPasswordAuth: authProvider === "supabase",
      supportsSocialAuth: authProvider === "supabase",
      isLoading,
      isAuthenticated,
      user,
      roles,
      permissions,
      can: (permission: string) => permissions.includes(permission),
      login: async (targetPath = "/app", credentials) => {
        if (authProvider === "supabase") {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          const supabase = getSupabaseClient();
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) {
            throw error;
          }

          setIsAuthenticated(Boolean(data.session));
          setUser(mapSupabaseUser(data.user));
          if (targetPath && window.location.pathname !== targetPath) {
            window.location.assign(`${window.location.origin}${targetPath}`);
          }
          return;
        }

        const keycloak = keycloakRef.current;

        if (!keycloak) {
          if (devBypass) {
            setIsAuthenticated(true);
            return;
          }
          throw new Error("Keycloak is not initialized");
        }

        await keycloak.login({
          redirectUri: `${window.location.origin}${targetPath}`,
        });
      },
      loginWithSocialProvider: async (socialProvider, targetPath = "/app") => {
        if (authProvider !== "supabase") {
          throw new Error("Social sign-in is handled by your identity provider");
        }

        if (!isSupabaseConfigured()) {
          throw new Error("Supabase environment variables are not configured");
        }

        await signInWithSupabaseOAuth(socialProvider, targetPath);
      },
      logout: async () => {
        if (authProvider === "supabase") {
          if (isSupabaseConfigured()) {
            const supabase = getSupabaseClient();
            await supabase.auth.signOut();
          }

          setIsAuthenticated(false);
          setUser(null);
          setRoles([]);
          setPermissions([]);
          return;
        }

        const keycloak = keycloakRef.current;

        if (!keycloak) {
          setIsAuthenticated(false);
          setUser(null);
          setRoles([]);
          setPermissions([]);
          return;
        }

        await keycloak.logout({
          redirectUri: `${window.location.origin}/login`,
        });
      },
      requestPasswordReset: async (email: string) => {
        if (authProvider !== "supabase") {
          throw new Error("Password resets are handled by your identity provider");
        }

        if (!email.trim()) {
          throw new Error("Enter your email first");
        }

        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login?mode=reset`,
        });

        if (error) {
          throw error;
        }
      },
      getAccessToken: async () => {
        if (authProvider === "supabase") {
          if (!isSupabaseConfigured()) {
            return null;
          }

          const supabase = getSupabaseClient();
          const { data } = await supabase.auth.getSession();
          return data.session?.access_token || null;
        }

        const keycloak = keycloakRef.current;

        if (!keycloak || !keycloak.authenticated) {
          return null;
        }

        await keycloak.updateToken(30);
        return keycloak.token || null;
      },
    };
  }, [isAuthenticated, isLoading, permissions, roles, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
