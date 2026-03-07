import type { RouteObject } from "react-router";
import { Navigate } from "react-router";
import { MarketingLayout } from "../components/marketing/marketing-layout";
import { MarketingPageRoute } from "../components/marketing/marketing-page";
import { legacyRedirects, marketingPagePaths } from "../content/marketing-content";

function RedirectTo({ to }: { to: string }) {
  return <Navigate to={to} replace />;
}

const pageRoutes: RouteObject[] = marketingPagePaths.map((path) =>
  path === "/"
    ? { index: true, Component: MarketingPageRoute }
    : {
        path: path.replace(/^\//, ""),
        Component: MarketingPageRoute,
      },
);

const redirectRoutes: RouteObject[] = legacyRedirects.map((redirect) => ({
  path: redirect.from,
  element: <RedirectTo to={redirect.to} />,
}));

export const marketingRoutes: RouteObject[] = [
  {
    path: "/",
    Component: MarketingLayout,
    children: [...pageRoutes, ...redirectRoutes],
  },
];
