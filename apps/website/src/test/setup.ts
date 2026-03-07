import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("keycloak-js", () => {
  class MockKeycloak {
    authenticated = false;
    token: string | undefined;
    tokenParsed: Record<string, unknown> | undefined;

    async init() {
      return false;
    }

    async login() {
      return undefined;
    }

    async logout() {
      return undefined;
    }

    async updateToken() {
      return false;
    }
  }

  return {
    default: MockKeycloak,
  };
});
