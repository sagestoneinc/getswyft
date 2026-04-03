import { useEffect, useMemo, useRef, useState } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import Keycloak from "keycloak-js";
import { apiClient } from "./api-client";
import { getDevUser, shouldUseDevAuthBypass } from "./dev-bypass";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";

type AuthUser = {
  sub?: string;
  email?: string;
  name?: string;
};

type LoginCredentials = {
  email: string;
  password: string;
};

type AgentAuth = {
  provider: "keycloak" | "supabase";
  supportsPasswordAuth: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  error: string | null;
  login: (credentials?: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

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

export function useAgentAuth(): AgentAuth {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const keycloakRef = useRef<Keycloak | null>(null);

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | undefined;

    async function applyDevBypass() {
      apiClient.setAccessTokenProvider(async () => null);

      if (!mounted) {
        return;
      }

      const devUser = getDevUser();
      setIsAuthenticated(true);
      setUser({
        sub: `dev|${devUser.id}`,
        email: devUser.email,
        name: devUser.name,
      });
      setError(null);
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
      setError(null);
      setIsLoading(false);
    }

    async function initSupabase() {
      if (!isSupabaseConfigured()) {
        if (shouldUseDevAuthBypass()) {
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
        if (shouldUseDevAuthBypass()) {
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

      setError(null);
      setIsLoading(false);
    }

    const init = authProvider === "supabase" ? initSupabase : initKeycloak;

    init().catch(async (initError) => {
      if (!mounted) {
        return;
      }

      if (shouldUseDevAuthBypass()) {
        await applyDevBypass();
        return;
      }

      setError(initError instanceof Error ? initError.message : "Authentication failed to initialize");
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, []);

  return useMemo(() => {
    return {
      provider: authProvider,
      supportsPasswordAuth: authProvider === "supabase",
      isLoading,
      isAuthenticated,
      user,
      error,
      login: async (credentials) => {
        setError(null);

        if (authProvider === "supabase") {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          const supabase = getSupabaseClient();
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (signInError) {
            throw signInError;
          }

          setIsAuthenticated(Boolean(data.session));
          setUser(mapSupabaseUser(data.user));
          return;
        }

        const keycloak = keycloakRef.current;
        if (!keycloak) {
          if (shouldUseDevAuthBypass()) {
            const devUser = getDevUser();
            setIsAuthenticated(true);
            setUser({
              sub: `dev|${devUser.id}`,
              email: devUser.email,
              name: devUser.name,
            });
            return;
          }

          throw new Error("Keycloak is not initialized");
        }

        await keycloak.login({
          redirectUri: window.location.origin,
        });
      },
      logout: async () => {
        setError(null);

        if (authProvider === "supabase") {
          if (isSupabaseConfigured()) {
            const supabase = getSupabaseClient();
            await supabase.auth.signOut();
          }

          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        const keycloak = keycloakRef.current;
        if (!keycloak) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        await keycloak.logout({
          redirectUri: window.location.origin,
        });
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
  }, [error, isAuthenticated, isLoading, user]);
}
