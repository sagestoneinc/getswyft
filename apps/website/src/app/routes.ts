import { createBrowserRouter } from "react-router";
import { marketingRoutes } from "./routes/marketing-routes";
import { privateRoutes } from "./routes/private-routes";

export const router = createBrowserRouter([...marketingRoutes, ...privateRoutes]);
