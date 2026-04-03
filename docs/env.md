# Environment Variables

## API (`apps/api`)

### Runtime

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`) |
| `PORT` | `8080` | HTTP server port |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:4174` | Comma-separated allowed CORS origins |
| `LOG_LEVEL` | `info` | Log verbosity (`debug`, `info`, `warn`, `error`) |

### Data stores

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string (used for presence and caching) |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_PROVIDER` | `supabase` | Auth provider (`supabase`, `keycloak`, `generic`) |
| `AUTH_ISSUER_URL` | — | OIDC issuer URL for token verification |
| `AUTH_AUDIENCE` | — | Expected JWT audience claim |
| `AUTH_JWKS_URI` | — | JWKS endpoint URL (auto-derived from issuer when omitted) |
| `SUPABASE_URL` | — | Supabase project URL (when `AUTH_PROVIDER=supabase`) |
| `JWT_SECRET` | — | Shared secret for internal widget visitor tokens |
| `SUPABASE_DB_URL` | — | Supabase Postgres connection string used by `db:sync` and `supabase:migrate` |
| `SUPABASE_DB_FORCE_IPV4` | `true` | Force IPv4 DNS lookup for Supabase migration connectivity |
| `SUPABASE_DB_URL_IPV4` | — | Optional IPv4-safe Supabase Postgres URL override |
| `DEV_AUTH_BYPASS` | `false` | Enable header-based auth bypass for local development |
| `DEV_DEFAULT_TENANT_SLUG` | `default` | Tenant slug used during dev auth bypass |
| `APP_BASE_URL` | `http://localhost:5173` | Base URL used in invitation emails and links |

### Email

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_PROVIDER` | `log` | Email provider (`log` for dev console, `resend` or `mailgun` for production) |
| `EMAIL_FROM` | — | Sender address for outgoing emails |
| `EMAIL_REPLY_TO` | — | Reply-to address for outgoing emails |
| `RESEND_API_KEY` | — | Resend API key (when `EMAIL_PROVIDER=resend`) |
| `MAILGUN_API_KEY` | — | Mailgun API key (when `EMAIL_PROVIDER=mailgun`) |
| `MAILGUN_DOMAIN` | — | Mailgun sending domain (when `EMAIL_PROVIDER=mailgun`) |
| `MAILGUN_BASE_URL` | `https://api.mailgun.net` | Mailgun API base URL (set to EU endpoint if needed) |

### Storage

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_PROVIDER` | `local` | File storage provider (`local` or `s3`) |
| `S3_BUCKET_NAME` | — | S3 bucket name |
| `S3_REGION` | `us-east-1` | S3 region |
| `S3_ENDPOINT` | — | S3-compatible endpoint URL (for MinIO, R2, etc.) |
| `S3_ACCESS_KEY_ID` | — | S3 access key |
| `S3_SECRET_ACCESS_KEY` | — | S3 secret key |

### Voice / Video

| Variable | Default | Description |
|----------|---------|-------------|
| `LIVEKIT_URL` | — | LiveKit server URL (scaffolded, not yet integrated) |
| `LIVEKIT_API_KEY` | — | LiveKit API key |
| `LIVEKIT_API_SECRET` | — | LiveKit API secret |

### Push notifications

| Variable | Default | Description |
|----------|---------|-------------|
| `PUSH_PROVIDER` | `log` | Push provider (`log` for dev console, `fcm` for Firebase Cloud Messaging) |
| `FCM_PROJECT_ID` | — | Firebase project ID |
| `FCM_CLIENT_EMAIL` | — | Firebase service account email |
| `FCM_PRIVATE_KEY` | — | Firebase service account private key |

### Telephony

| Variable | Default | Description |
|----------|---------|-------------|
| `TELEPHONY_PROVIDER` | `log` | Telephony provider (`log` for dev console, `telnyx` for production) |
| `TELNYX_API_KEY` | — | Telnyx API key |
| `TELNYX_CONNECTION_ID` | — | Telnyx connection ID for outbound calls |
| `TELNYX_MESSAGING_PROFILE_ID` | — | Telnyx messaging profile ID |
| `TELNYX_FROM_NUMBER` | — | Outbound caller ID phone number |

### AI runtime

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | Default OpenAI-compatible API key for tenant AI workloads |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Override for OpenAI-compatible base URL |
| `OPENAI_MODEL` | `gpt-4o-mini` | Default model when tenant config does not specify one |
| `AI_HTTP_TIMEOUT_MS` | `30000` | Timeout for outbound AI provider calls |

### Rate limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | `60000` | Sliding window used for in-memory API rate limiting |
| `RATE_LIMIT_MAX` | `300` | Max requests per window for unauthenticated/general traffic |
| `RATE_LIMIT_AUTH_MAX` | `120` | Max requests per window for authenticated traffic |
| `RATE_LIMIT_WIDGET_MAX` | `30` | Max requests per window for public widget endpoints |

## Website (`apps/website`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend API base URL |
| `VITE_WS_BASE_URL` | `http://localhost:8080` | WebSocket base URL |
| `VITE_AUTH_PROVIDER` | `supabase` | Auth provider (`keycloak`, `supabase`, `firebase`) |
| `VITE_KEYCLOAK_URL` | — | Keycloak server URL |
| `VITE_KEYCLOAK_REALM` | — | Keycloak realm |
| `VITE_KEYCLOAK_CLIENT_ID` | — | Keycloak client ID |
| `VITE_SUPABASE_URL` | — | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | — | Supabase anonymous API key |
| `VITE_FIREBASE_API_KEY` | — | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | — | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | — | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | — | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | — | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | — | Firebase app ID |
| `VITE_FIREBASE_VAPID_KEY` | — | Firebase VAPID key for web push |
| `VITE_AUTH_PASSWORD_RESET_REDIRECT_PATH` | `/login?mode=reset` | Optional override path/URL used for Supabase password reset links |
| `VITE_DEV_AUTH_BYPASS` | `false` | Enable dev auth bypass (must also be enabled on the API) |
| `VITE_DEV_USER_ID` | — | Simulated user ID during dev bypass |
| `VITE_DEV_USER_EMAIL` | — | Simulated user email during dev bypass |
| `VITE_DEV_TENANT_SLUG` | — | Simulated tenant slug during dev bypass |
| `VITE_SWYFT_WIDGET_SCRIPT_URL` | — | Optional production widget script URL for embedding SwyftUp chat on marketing pages |
| `VITE_SWYFT_WIDGET_WORKSPACE_ID` | — | Workspace identifier passed to the embedded widget script |
| `VITE_SWYFT_WIDGET_LAUNCHER` | — | Optional launcher mode/config key for widget behavior |
| `VITE_SWYFT_WIDGET_ENV` | — | Optional environment hint (`staging`, `production`, etc.) for widget initialization |
| `VITE_SWYFT_WIDGET_POSITION` | `right` | Optional launcher placement: `right` (lower-right) or `left` (lower-left) |

### Getting widget env vars for marketing site

- `VITE_SWYFT_WIDGET_SCRIPT_URL`
  Use the public URL where the widget app is hosted, ending with `/embed.js`.
  Example: `https://widget.getswyftup.com/embed.js`
- `VITE_SWYFT_WIDGET_WORKSPACE_ID`
  Use the target tenant/workspace ID from SwyftUp backend data (`tenant.id`).
  You can fetch it from `GET /v1/tenants/current` while authenticated as that workspace.
- `VITE_SWYFT_WIDGET_LAUNCHER` (optional)
  Suggested default: `bubble`. Other supported values: `open`, `expanded`.
- `VITE_SWYFT_WIDGET_ENV` (optional)
  Set a readable runtime label such as `production` or `staging`.
- `VITE_SWYFT_WIDGET_POSITION` (optional)
  Controls where the launcher sits on the page.
  Supported values: `right`/`bottom-right` or `left`/`bottom-left`.

### Auth link sanity checks

- API env `APP_BASE_URL` must be your live app domain (example: `https://www.getswyftup.com`), otherwise invite links can point to localhost.
- In Supabase URL Configuration, include:
  - Site URL: `https://www.getswyftup.com`
  - Redirect URL: `https://www.getswyftup.com/login?mode=reset`

## Agent / Widget (`apps/agent`, `apps/widget`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | — | Backend API base URL |
| `VITE_WS_BASE_URL` | — | WebSocket base URL |
| `VITE_SOCKET_TOKEN` | — | Optional pre-shared token for non-visitor socket authentication |
