import { apiClient } from "./api-client";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
  roleKeys: string[];
  status: "online" | "offline" | "busy" | "away";
  conversations: number;
  createdAt: string;
  updatedAt: string;
};

export type TeamInvitation = {
  id: string;
  email: string;
  role: "admin" | "agent";
  roleKey: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  invitedBy: string;
  sentAt: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
};

type TeamResponse = {
  ok: boolean;
  members: TeamMember[];
  invitations: TeamInvitation[];
};

export async function getTeamState() {
  return apiClient.get<TeamResponse>("/v1/users/team");
}

export async function inviteTeamMember(payload: { email: string; role: "admin" | "agent" }) {
  return apiClient.post<{ ok: boolean; invitation: TeamInvitation }>("/v1/users/team/invitations", payload);
}

export async function updateTeamMemberRole(memberId: string, payload: { role: "admin" | "agent" }) {
  return apiClient.patch<{ ok: boolean; member: TeamMember }>(`/v1/users/team/members/${memberId}/role`, payload);
}

export async function getAssignableMembers() {
  return apiClient.get<{
    ok: boolean;
    members: TeamMember[];
  }>("/v1/users/team/assignable");
}

export function formatInvitationTimestamp(value: string | null) {
  if (!value) {
    return "Pending";
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return "";
  }

  return timestamp.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
