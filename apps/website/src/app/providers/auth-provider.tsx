import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Keycloak from "keycloak-js";
import { apiClient } from "../lib/api-client";

type AuthUser = {
  sub?: string;
  email?: string;
  name?: string;
};

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (targetPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const authProvider = (import.meta.env.VITE_AUTH_PROVIDER as string | undefined) || "keycloak";
const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL as string | undefined;
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM as string | undefined;
const keycloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string | undefined;
const devBypass = (import.meta.env.VITE_DEV_AUTH_BYPASS as string | undefined) !== "false";

function mapTokenToUser(tokenParsed: Keycloak.KeycloakTokenParsed | undefined): AuthUser | null {
  if (!tokenParsed) {
    return null;
  }

  return {
    sub: tokenParsed.sub,
    email: tokenParsed.email,
    name: tokenParsed.name || tokenParsed.preferred_username,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const keycloakRef = useRef<Keycloak | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (authProvider !== "keycloak") {
        throw new Error(`Unsupported VITE_AUTH_PROVIDER=${authProvider}. Only 'keycloak' is supported now.`);
      }

      if (!keycloakUrl || !keycloakRealm || !keycloakClientId) {
        if (devBypass) {
          apiClient.setAccessTokenProvider(async () => null);
          if (!mounted) {
            return;
          }

          setIsAuthenticated(true);
          setUser({
            sub: "dev|local-user",
            email: "admin@getswyft.local",
            name: "Local Admin",
          });
          setIsLoading(false);
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
      setUser(mapTokenToUser(keycloak.tokenParsed));

      apiClient.setAccessTokenProvider(async () => {
        if (!keycloak.authenticated) {
          return null;
        }

        await keycloak.updateToken(30);
        return keycloak.token || null;
      });

      setIsLoading(false);
    }

    init().catch((error) => {
      if (!mounted) {
        return;
      }

      if (devBypass) {
        apiClient.setAccessTokenProvider(async () => null);
        setIsAuthenticated(true);
        setUser({
          sub: "dev|local-user",
          email: "admin@getswyft.local",
          name: "Local Admin",
        });
      }

      setIsLoading(false);
      if (!devBypass) {
        console.error(error);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      isLoading,
      isAuthenticated,
      user,
      login: async (targetPath = "/app") => {
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
      logout: async () => {
        const keycloak = keycloakRef.current;

        if (!keycloak) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        await keycloak.logout({
          redirectUri: `${window.location.origin}/login`,
        });
      },
      getAccessToken: async () => {
        const keycloak = keycloakRef.current;

        if (!keycloak || !keycloak.authenticated) {
          return null;
        }

        await keycloak.updateToken(30);
        return keycloak.token || null;
      },
    };
  }, [isAuthenticated, isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
