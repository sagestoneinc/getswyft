# File Uploads and Storage

## Summary

Getswyft supports file attachments in conversation messages, allowing visitors and agents to share documents, images, and other files during a chat. The file upload system uses presigned URLs for secure, direct-to-storage uploads and supports two storage backends: Amazon S3 (production) and local filesystem (development). All upload endpoints are mounted at `/v1/storage`.

## Who Can Use This

- **Site visitors** — users chatting through the visitor widget who want to attach files to their messages.
- **Support agents** — users in the agent console who need to send or receive file attachments within conversations.
- **Platform administrators** — teams responsible for configuring storage providers and managing upload limits.

## What It Does

The file upload system provides the following capabilities:

- **Presigned URL generation** — the `POST /v1/storage/presign-upload` endpoint generates a presigned upload URL. In production, this is a presigned S3 URL. In development, it returns a local upload endpoint. Files are limited to **25 MB** per upload.
- **File upload** — the `PUT /v1/storage/upload` endpoint handles the actual file transfer to either S3 or local storage. The request body contains the raw file data.
- **Message attachments** — uploaded files are associated with conversation messages through the `MessageAttachment` model, which tracks the `storageKey`, `contentType`, `size`, and `fileName` for each attachment.
- **Attachment limits** — each message supports a maximum of **5 attachments**.
- **Dual storage backends** — the system supports Amazon S3 for production deployments and local filesystem storage for development environments. S3-compatible services such as MinIO and Cloudflare R2 are supported through the configurable `S3_ENDPOINT`.

## Key Functions / Actions Available

| Action | Description |
|---|---|
| Request a presigned upload URL | Call `POST /v1/storage/presign-upload` to get a secure URL for uploading a file. |
| Upload a file | Send the file data to the presigned URL or `PUT /v1/storage/upload` endpoint. |
| Attach file to a message | Include the uploaded file's storage key when sending a conversation message. |
| View attachments | Open or download file attachments from received messages in the chat view. |

## Step-by-Step How to Use It

### Attaching a File in the Visitor Widget

1. Open the chat widget on a listing page and start or resume a conversation.
2. Click the **file attachment button** in the chat composer.
3. Select a file from your device. The file must be **25 MB or smaller**.
4. The widget requests a presigned upload URL from `POST /v1/storage/presign-upload`.
5. The file is uploaded directly to storage using the presigned URL.
6. Once the upload completes, the file is attached to your next message. Send the message as usual.
7. The agent receives the message with the file attachment visible in the chat view.

### Attaching a File in the Agent Console

1. Open a conversation in the agent console chat view.
2. Click the **file attachment button** in the message composer.
3. Select a file from your device (maximum **25 MB**).
4. The console requests a presigned upload URL and uploads the file to storage.
5. The file is attached to your reply. Send the message to deliver it to the visitor.

### Multiple Attachments

- You can attach up to **5 files** per message.
- Repeat the file selection process for each additional attachment before sending the message.

## System Behavior / What Users Should Expect

- **Presigned URL flow**: when a file is selected, the application first requests a presigned URL from the server. This URL authorizes a direct upload to the storage backend without routing file data through the API server.
- **Upload size limit**: files exceeding **25 MB** are rejected. The system validates file size before generating a presigned URL.
- **Attachment limit**: a maximum of **5 attachments** can be included in a single message. Attempting to add more is blocked by the client.
- **Storage key tracking**: each uploaded file is tracked by a `MessageAttachment` record containing:
  - `storageKey` — the unique identifier for the file in storage.
  - `contentType` — the MIME type of the file (e.g., `image/png`, `application/pdf`).
  - `size` — the file size in bytes.
  - `fileName` — the original file name.
- **S3-compatible storage**: in production, files are stored in an S3 bucket. The system also supports S3-compatible services (MinIO, Cloudflare R2) via the `S3_ENDPOINT` configuration.
- **Local storage**: in development environments, files are stored on the local filesystem instead of S3.

## Permissions Required

- **`conversation.write`** permission is required to use the upload endpoints. This permission is granted automatically to authenticated visitors (via `visitorJwt`) and agents (via `agentJwt`) who are participants in the conversation.
- Unauthenticated users cannot upload files.

## Common Issues

| Issue | Cause | Resolution |
|---|---|---|
| Upload fails with size error | The file exceeds the 25 MB limit. | Choose a smaller file or compress the file before uploading. |
| "Too many attachments" error | More than 5 files were added to a single message. | Remove one or more attachments before sending, or send multiple messages. |
| Presigned URL request fails | The storage service is misconfigured or unreachable. | Verify storage configuration. In production, check S3 credentials and bucket settings. In development, confirm local storage paths are writable. |
| File not appearing after upload | The upload may have failed silently or the storage key was not linked to the message. | Retry the upload. If the issue persists, check server logs for storage errors. |
| S3 access denied | S3 credentials are invalid or the bucket policy is too restrictive. | Verify `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, and `S3_REGION` in the environment configuration. |

## Support Notes / Troubleshooting

- **API mount point**: all storage endpoints are mounted at `/v1/storage`.
- **Storage provider configuration (S3)**:
  - `S3_BUCKET_NAME` — the name of the S3 bucket for file storage.
  - `S3_REGION` — the AWS region of the bucket.
  - `S3_ENDPOINT` — custom endpoint URL for S3-compatible services such as MinIO or Cloudflare R2. Leave unset for standard AWS S3.
  - `S3_ACCESS_KEY_ID` — the access key for S3 authentication.
  - `S3_SECRET_ACCESS_KEY` — the secret key for S3 authentication.
- **Development mode**: when running locally, the system uses filesystem storage instead of S3. No S3 configuration is required for development.
- **Debugging uploads**: if uploads fail, check the server logs for errors from the storage provider. For S3, verify that the bucket exists, credentials are valid, and the bucket's CORS policy allows uploads from the application's origin.

## Related Pages

- [Visitor Widget](widget.md) — the embeddable widget where visitors can attach files to messages.
- [Agent Console](agent-console.md) — the agent application where agents send and receive file attachments.
