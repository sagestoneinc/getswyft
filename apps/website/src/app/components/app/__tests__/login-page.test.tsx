import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../../../providers/auth-provider", () => ({
  useAuth: () => ({
    provider: "supabase",
    supportsPasswordAuth: true,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    requestPasswordReset: vi.fn(),
    getAccessToken: vi.fn(),
    roles: [],
    permissions: [],
    can: vi.fn(() => false),
    user: null,
  }),
}));

let LoginPage: (typeof import("../login-page"))["LoginPage"];

beforeAll(async () => {
  ({ LoginPage } = await import("../login-page"));
});

describe("LoginPage", () => {
  it("renders sign in view", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });
});
