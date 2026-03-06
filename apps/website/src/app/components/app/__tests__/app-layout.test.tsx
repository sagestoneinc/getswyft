import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { AppLayout } from "../app-layout";

vi.mock("../../../providers/auth-provider", () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: false,
    user: null,
    logout: vi.fn(),
  }),
}));

vi.mock("../../../providers/tenant-provider", () => ({
  useTenant: () => ({
    tenant: null,
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    featureFlags: {},
  }),
}));

describe("AppLayout", () => {
  it("redirects unauthenticated users to login", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route path="/login" element={<div>Login Route</div>} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<div>App Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login Route")).toBeInTheDocument();
  });
});
