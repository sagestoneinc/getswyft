import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Auth0Client, type User } from "@auth0/auth0-spa-js";
import { apiClient } from "../lib/api-client";

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  login: (targetPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const authDomain = import.meta.env.VITE_AUTH_DOMAIN as string | undefined;
const authClientId = import.meta.env.VITE_AUTH_CLIENT_ID as string | undefined;
const authAudience = import.meta.env.VITE_AUTH_AUDIENCE as string | undefined;
const devBypass = (import.meta.env.VITE_DEV_AUTH_BYPASS as string | undefined) !== "false";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<Auth0Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!authDomain || !authClientId) {
        if (devBypass) {
          setIsAuthenticated(true);
          setUser({
            sub: "dev|local-user",
            email: "admin@getswyft.local",
            name: "Local Admin",
          });

          apiClient.setAccessTokenProvider(async () => null);
        }

        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      const auth0 = new Auth0Client({
        domain: authDomain,
        clientId: authClientId,
        authorizationParams: {
          audience: authAudience,
          redirect_uri: `${window.location.origin}/login`,
        },
        cacheLocation: "localstorage",
      });

      setClient(auth0);

      if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
        const callback = await auth0.handleRedirectCallback();
        const target = callback.appState?.returnTo || "/app";
        window.history.replaceState({}, document.title, target);
      }

      const authenticated = await auth0.isAuthenticated();
      const profile = authenticated ? await auth0.getUser() : null;

      if (!mounted) {
        return;
      }

      setIsAuthenticated(authenticated);
      setUser(profile || null);

      apiClient.setAccessTokenProvider(async () => {
        if (!authenticated) {
          return null;
        }

        return auth0.getTokenSilently();
      });

      setIsLoading(false);
    }

    init().catch(() => {
      if (mounted) {
        setIsLoading(false);
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
        if (!client) {
          if (devBypass) {
            setIsAuthenticated(true);
            return;
          }
          throw new Error("Auth provider is not configured");
        }

        await client.loginWithRedirect({
          appState: {
            returnTo: targetPath,
          },
        });
      },
      logout: async () => {
        if (!client) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        client.logout({
          logoutParams: {
            returnTo: `${window.location.origin}/login`,
          },
        });
      },
      getAccessToken: async () => {
        if (!client || !isAuthenticated) {
          return null;
        }

        return client.getTokenSilently();
      },
    };
  }, [client, isAuthenticated, isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
