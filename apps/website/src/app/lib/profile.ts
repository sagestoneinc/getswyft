import { apiClient } from "./api-client";

export type UserProfile = {
  id: string;
  externalAuthId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  timezone: string | null;
  locale: string | null;
  metadata: Record<string, unknown>;
};

type ProfileResponse = {
  ok: boolean;
  profile: UserProfile;
};

export async function getProfile() {
  const response = await apiClient.get<ProfileResponse>("/v1/auth/profile");
  return response.profile;
}

export async function updateProfile(payload: {
  displayName: string;
  phone?: string;
  timezone?: string;
  locale?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  const response = await apiClient.patch<ProfileResponse>("/v1/auth/profile", payload);
  return response.profile;
}
