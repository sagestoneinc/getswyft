import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = {
  login: vi.fn(async () => undefined),
  loginWithSocialProvider: vi.fn(async () => undefined),
  logout: vi.fn(async () => undefined),
  requestPasswordReset: vi.fn(async () => undefined),
  getAccessToken: vi.fn(async () => null),
};

const updateUserMock = vi.fn(async () => ({ error: null }));

vi.mock("../../../providers/auth-provider", () => ({
  useAuth: () => ({
    provider: "supabase",
    supportsPasswordAuth: true,
    supportsSocialAuth: true,
    isAuthenticated: false,
    isLoading: false,
    login: authMocks.login,
    loginWithSocialProvider: authMocks.loginWithSocialProvider,
    logout: authMocks.logout,
    requestPasswordReset: authMocks.requestPasswordReset,
    getAccessToken: authMocks.getAccessToken,
    roles: [],
    permissions: [],
    can: vi.fn(() => false),
    user: null,
  }),
}));

vi.mock("../../../lib/supabase", () => ({
  isSupabaseConfigured: () => true,
  getSupabaseClient: () => ({
    auth: {
      updateUser: updateUserMock,
    },
  }),
}));

let LoginPage: (typeof import("../login-page"))["LoginPage"];

beforeAll(async () => {
  ({ LoginPage } = await import("../login-page"));
});

beforeEach(() => {
  authMocks.login.mockClear();
  authMocks.loginWithSocialProvider.mockClear();
  authMocks.requestPasswordReset.mockClear();
  updateUserMock.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("LoginPage", () => {
  function renderLogin(initialEntry = "/login") {
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("renders sign in view", () => {
    renderLogin();

    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with microsoft \/ outlook/i })).toBeInTheDocument();
  });

  it("shows invite context from invitation links", () => {
    renderLogin("/login?invite=test-token&tenant=swyftup&email=invitee@getswyftup.com");

    expect(screen.getByText("Invitation link detected")).toBeInTheDocument();
    expect(screen.getByText(/join the swyftup workspace/i)).toBeInTheDocument();
  });

  it("submits credentials for multiple account logins", async () => {
    renderLogin();

    fireEvent.change(screen.getAllByPlaceholderText("agent@brokerage.com").at(-1) as HTMLElement, {
      target: { value: "agent.one@getswyftup.com" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("Enter your password").at(-1) as HTMLElement, {
      target: { value: "Password#1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() =>
      expect(authMocks.login).toHaveBeenCalledWith("/app", {
        email: "agent.one@getswyftup.com",
        password: "Password#1",
      }),
    );

    fireEvent.change(screen.getAllByPlaceholderText("agent@brokerage.com").at(-1) as HTMLElement, {
      target: { value: "agent.two@getswyftup.com" },
    });
    fireEvent.change(screen.getAllByPlaceholderText("Enter your password").at(-1) as HTMLElement, {
      target: { value: "Password#2" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() =>
      expect(authMocks.login).toHaveBeenLastCalledWith("/app", {
        email: "agent.two@getswyftup.com",
        password: "Password#2",
      }),
    );
    expect(authMocks.login).toHaveBeenCalledTimes(2);
  });

  it("completes password reset mode with Supabase updateUser", async () => {
    renderLogin("/login?mode=reset");

    fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), { target: { value: "ResetPass#123" } });
    fireEvent.change(screen.getByPlaceholderText("Re-enter password"), { target: { value: "ResetPass#123" } });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() =>
      expect(updateUserMock).toHaveBeenCalledWith({
        password: "ResetPass#123",
      }),
    );
  });

  it("enters recovery mode when Supabase provides type=recovery", () => {
    renderLogin("/login?type=recovery");

    expect(screen.getByText("Reset Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
  });
});
