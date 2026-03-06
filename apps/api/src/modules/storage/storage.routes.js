import { Router } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env.js";
import { writeAuditLog } from "../../lib/audit.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { requireTenant } from "../../middleware/tenant.js";

export const storageRouter = Router();

function sanitizeFileName(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function createS3Client() {
  if (!env.S3_BUCKET_NAME || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    return null;
  }

  return new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(env.S3_ENDPOINT),
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });
}

storageRouter.post(
  "/presign-upload",
  requireAuth,
  requireTenant,
  requirePermission("conversation.write"),
  async (req, res, next) => {
    try {
      const filename = String(req.body?.filename || "upload.bin");
      const contentType = String(req.body?.contentType || "application/octet-stream");
      const safeFilename = sanitizeFileName(filename);
      const key = `${req.tenant.slug}/${req.auth.user.id}/${Date.now()}-${safeFilename}`;

      let uploadUrl = null;
      let provider = "local";

      if (env.STORAGE_PROVIDER === "s3") {
        const s3 = createS3Client();
        if (s3 && env.S3_BUCKET_NAME) {
          const command = new PutObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
          });
          uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
          provider = "s3";
        }
      }

      if (!uploadUrl) {
        uploadUrl = `/uploads/${key}`;
      }

      await writeAuditLog(req, {
        action: "storage.presign_upload",
        entityType: "storage_object",
        entityId: key,
        metadata: {
          provider,
          contentType,
        },
      });

      return res.json({
        ok: true,
        provider,
        key,
        uploadUrl,
        expiresInSeconds: provider === "s3" ? 900 : null,
      });
    } catch (error) {
      return next(error);
    }
  }
);
