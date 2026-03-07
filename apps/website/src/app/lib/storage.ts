import { apiClient } from "./api-client";

export async function createUploadTarget(payload: { filename: string; contentType: string }) {
  return apiClient.post<{
    ok: boolean;
    provider: "s3" | "local";
    key: string;
    uploadUrl: string;
    expiresInSeconds: number | null;
  }>("/v1/storage/presign-upload", payload);
}
