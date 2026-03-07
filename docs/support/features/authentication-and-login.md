# Authentication and Login

Getswyft uses a multi-provider authentication system to securely verify user identity across the platform. Users can sign in through the website login page, the agent console, or be authenticated automatically as visitors through the embedded widget.

## Who Can Use This

- **All users** can access the login page and authenticate with their credentials.
- **Agents** use the dedicated agent console login page.
- **Visitors** are authenticated automatically when they interact with the embedded widget on a listing page.
- **Developers** have access to a development-only auth bypass for local testing. **Warning:** This bypass (`DEV_AUTH_BYPASS=true`) must never be enabled in production or any customer-facing environment. See [Support Notes](#support-notes--troubleshooting) for details.

## What It Does

The authentication system manages how users prove their identity and gain access to Getswyft features. It supports multiple identity providers — Keycloak, Supabase, and Firebase — so organizations can integrate with their existing infrastructure. Once authenticated, users receive a JWT/OIDC token that is verified against the provider's JWKS endpoint on every request.

There are three distinct authentication flows:

1. **Website login page** — The primary login for dashboard users. Supports email/password, Google SSO, and Azure/Microsoft SSO.
2. **Agent console login** — A separate login page specifically for agents, supporting email and password authentication.
3. **Widget visitor sessions** — When a visitor interacts with the chat widget on a property listing, a session is created automatically via `POST /v1/widget/session`. No manual login is required.

## Key Functions / Actions Available

- Sign in with email and password
- Sign in with Google SSO
- Sign in with Azure/Microsoft SSO
- Reset a forgotten password
- Toggle password visibility on the login form
- Enable "Remember me" to persist the session
- View current user info, tenant, roles, and permissions via `GET /v1/auth/me`
- View and update user profile via `GET /v1/auth/profile` and `PATCH /v1/auth/profile`
- Create a visitor session through the widget (`POST /v1/widget/session`)

## Step-by-Step How to Use It

### Logging In with Email and Password

1. Navigate to the Getswyft login page.
2. Enter your registered email address in the **Email** field.
3. Enter your password in the **Password** field.
   - Use the **visibility toggle** (eye icon) to show or hide your password as needed.
4. Optionally, check the **Remember me** checkbox to stay signed in across browser sessions.
5. Click **Sign In**.
6. If your credentials are valid, you will be redirected to the dashboard.

### Logging In with SSO (Google or Azure/Microsoft)

1. Navigate to the Getswyft login page.
2. Click **Sign in with Google** or **Sign in with Microsoft**, depending on your organization's identity provider.
3. You will be redirected to the provider's authentication page.
4. Complete the sign-in process with your provider credentials.
5. Once authenticated, you will be redirected back to the Getswyft dashboard.

### Resetting Your Password

1. Navigate to the Getswyft login page.
2. Click the **Forgot password** link below the sign-in form.
3. Enter the email address associated with your account.
4. Click **Submit** (or the equivalent button).
5. Check your email inbox for a password reset link.
6. Click the link in the email and follow the prompts to set a new password.
7. Return to the login page and sign in with your new password.

### Agent Console Login

1. Navigate to the agent console login page (this is a separate URL from the main dashboard login).
2. Enter your agent email address and password.
3. Click **Sign In**.
4. You will be redirected to the agent console.

## System Behavior / What Users Should Expect

- After a successful login, the system issues a JWT/OIDC token that is included in all subsequent API requests.
- Tokens are verified against the identity provider's JWKS (JSON Web Key Set) endpoint on every request.
- The `GET /v1/auth/me` endpoint returns the authenticated user's information, including their tenant, assigned roles, and granular permissions. The platform uses this data to control access to features throughout the application.
- If a token expires or becomes invalid, the user will be prompted to log in again.
- When "Remember me" is enabled, the session persists across browser restarts. When it is not enabled, the session ends when the browser is closed.
- Widget visitor sessions are created on the fly when a visitor first interacts with the chat widget. No credentials are required — the session is tied to the visitor's browser.

## Permissions Required

| Action | Permission Key | Notes |
| --- | --- | --- |
| Log in | None | Any registered user can authenticate |
| View own profile | Authenticated | Requires a valid session |
| Update own profile | Authenticated | Requires a valid session |
| Access dashboard features | Varies | Determined by roles and permissions returned by `/v1/auth/me` |

## Common Issues

- **"Invalid credentials" error** — The email or password entered does not match any account. Double-check for typos and verify Caps Lock is off.
- **SSO redirect fails** — The organization may not have SSO configured, or the user's email domain may not be linked to the SSO provider. Contact your administrator.
- **Password reset email not received** — Check your spam or junk folder. Ensure the email address matches the one registered in Getswyft.
- **Session expires unexpectedly** — If "Remember me" was not checked, the session will end when the browser is closed. Token expiration policies are configured by the identity provider.
- **Agent console login page not loading** — Ensure you are navigating to the correct agent console URL, which is separate from the main dashboard login.

## Support Notes / Troubleshooting

- **Dev Auth Bypass (`DEV_AUTH_BYPASS=true`)**: This is a development-only feature that allows developers to skip authentication during local development. It must **never** be enabled in production or any customer-facing environment. If a user reports that authentication appears to be disabled, verify that this flag is not set in the environment configuration.
- If a user is authenticated but cannot access certain features, check the response from `GET /v1/auth/me` to confirm their roles and permissions are correctly assigned.
- For SSO issues, verify the identity provider configuration (Keycloak, Supabase, or Firebase) and ensure the JWKS endpoint is reachable.
- If the widget is not creating visitor sessions, confirm that the widget is correctly embedded and that the `POST /v1/widget/session` endpoint is accessible from the hosting domain.

## Related Pages

- [Inbox and Conversations](inbox-and-conversations.md)
