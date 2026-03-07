# Profile & User Settings

## Summary

The Profile page allows authenticated users to view and update their personal information, including their display name, phone number, timezone, locale, and avatar. It also displays read-only account details such as email address and authentication provider, and provides the ability to request a password reset for users who authenticate with a password.

**Route:** `/app/profile`

## Who Can Use This

This feature is available to **all authenticated users**. No specific permission beyond a valid login session is required.

## What It Does

The Profile page reads and writes user data through two API endpoints:

- **`GET /v1/auth/profile`** — Retrieves the current user's profile, including display name, email, avatar URL, phone number, timezone, locale, and metadata.
- **`PATCH /v1/auth/profile`** — Updates editable profile fields. Accepts `displayName`, `phone`, `timezone`, `locale`, `avatarUrl`, and `metadata`.

The underlying data is split across two models:

### User Model

| Field | Description | Editable |
|-------|-------------|----------|
| `displayName` | The user's display name (first and last name). | ✅ Yes |
| `email` | The user's email address. | ❌ No (read-only) |
| `avatarUrl` | URL to the user's profile image. | ✅ Yes |

### Profile Model

| Field | Description | Editable |
|-------|-------------|----------|
| `phone` | The user's phone number. | ✅ Yes |
| `timezone` | The user's preferred timezone (e.g., `America/New_York`). | ✅ Yes |
| `locale` | The user's preferred locale (e.g., `en-US`). | ✅ Yes |
| `metadata` | Arbitrary JSON metadata associated with the profile. | ✅ Yes |

## Key Functions / Actions Available

### Editable Fields

- **First Name & Last Name** — Displayed as separate fields on the form, stored together as `displayName`.
- **Phone Number** — A text input for the user's phone number.
- **Timezone Selector** — A dropdown to select the user's preferred timezone.
- **Locale Selector** — A dropdown to select the user's preferred locale/language setting.
- **Avatar** — The user's profile picture, updatable via `avatarUrl`.

### Read-Only Fields

- **Email Address** — Displayed on the profile page but cannot be changed through this form. Email changes, if supported, must be handled through a separate process.
- **Auth Provider** — Displays the authentication method used by the account (e.g., `password`, `google`, `microsoft`).

### Password Reset

For users who authenticate using a password (as opposed to an OAuth provider), the profile page includes a **Request Password Reset** action. This initiates the password reset flow, typically by sending a reset link to the user's registered email address.

## Step-by-Step How to Use It

### Viewing Your Profile

1. Log in to the platform.
2. Navigate to **Profile** in the sidebar or account menu.
3. The page loads and displays your current profile information, including name, email, phone, timezone, locale, and authentication provider.

### Updating Your Display Name

1. On the Profile page, locate the **First Name** and **Last Name** fields.
2. Edit either or both fields as needed.
3. Click **Save** to submit the changes.
4. A confirmation message appears when the update is successful.

### Updating Your Phone Number

1. On the Profile page, locate the **Phone Number** field.
2. Enter or update your phone number.
3. Click **Save** to submit the changes.

### Changing Your Timezone

1. On the Profile page, locate the **Timezone** dropdown.
2. Open the dropdown and select your preferred timezone from the list.
3. Click **Save** to apply the change.
4. The new timezone will be used for date and time display across the platform.

### Changing Your Locale

1. On the Profile page, locate the **Locale** dropdown.
2. Open the dropdown and select your preferred locale (e.g., `en-US`, `es-MX`).
3. Click **Save** to apply the change.
4. The locale setting affects language and formatting preferences where supported.

### Requesting a Password Reset

1. On the Profile page, locate the **Password** section.
2. Click **Request Password Reset** (this option is only available for accounts using password authentication).
3. A password reset link is sent to your registered email address.
4. Check your email and follow the link to set a new password.

## System Behavior / What Users Should Expect

- Profile changes are saved immediately when the user clicks **Save** and the API responds successfully.
- The email address field is **read-only** and cannot be modified from the Profile page. If a user needs to change their email, they should contact an administrator or follow the platform's email change process (if available).
- The authentication provider field is informational only. It indicates how the user logs in (e.g., password, Google OAuth, Microsoft OAuth) and cannot be changed from this page.
- The password reset option is only displayed for users whose auth provider is `password`. Users who sign in via OAuth providers (Google, Microsoft, etc.) will not see this option.
- Timezone and locale changes take effect across the platform on the next page load or session refresh.
- The `metadata` field on the Profile model stores arbitrary JSON and is not directly exposed in the UI form. It is available through the API for integrations or custom extensions.

## Permissions Required

| Permission | Description |
|------------|-------------|
| *(None beyond authentication)* | Any authenticated user can access and edit their own profile. |

## Common Issues

| Issue | Cause | Resolution |
|-------|-------|------------|
| Cannot edit email address | Email is a read-only field on the Profile page. | Contact an administrator if an email change is needed. |
| Password reset option not visible | User authenticates via an OAuth provider (e.g., Google, Microsoft) rather than a password. | Password management is handled by the OAuth provider. Visit the provider's account settings to change the password. |
| Password reset email not received | Email may be delayed, filtered to spam, or the email address on file is incorrect. | Check spam/junk folders. If the email does not arrive within a few minutes, contact support. |
| Timezone or locale change not reflected | Changes may require a page reload to take effect. | Refresh the page or log out and log back in. |
| Save button does not respond | A network error or validation issue may be preventing the request. | Check for validation errors on the form. Verify network connectivity. If the issue persists, contact support. |
| Display name appears incorrect after save | The first and last name fields are combined into `displayName`. Ensure both fields are filled in correctly. | Re-edit the name fields and save again. |

## Support Notes / Troubleshooting

- The profile API (`GET /v1/auth/profile`) returns a combined view of `User` and `Profile` model data. When troubleshooting, check both models if data appears inconsistent.
- The `PATCH /v1/auth/profile` endpoint accepts partial updates. Only fields included in the request body are modified; omitted fields remain unchanged.
- If a user reports that their profile data has reverted, check for concurrent sessions or API calls that may have overwritten recent changes.
- The `avatarUrl` field accepts a URL string. If a user's avatar is not displaying, verify that the URL is valid and publicly accessible.
- For password reset issues, verify that the platform's email delivery service is operational and that the user's email address in the system matches the one they are checking.

## Related Pages

- [Analytics](analytics.md)
- [Billing](billing.md)
