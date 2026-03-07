import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./providers/auth-provider";
import { TenantProvider } from "./providers/tenant-provider";

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <RouterProvider router={router} />
      </TenantProvider>
    </AuthProvider>
  );
}
