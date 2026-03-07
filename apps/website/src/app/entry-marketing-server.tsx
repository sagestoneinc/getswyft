import { RouterProvider, createMemoryRouter } from "react-router";
import { renderToString } from "react-dom/server";
import { marketingRoutes } from "./routes/marketing-routes";

export function renderMarketingRoute(pathname: string) {
  const router = createMemoryRouter(marketingRoutes, {
    initialEntries: [pathname],
  });

  return renderToString(<RouterProvider router={router} />);
}
