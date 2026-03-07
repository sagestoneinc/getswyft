# Supabase Auth Email Templates (SwyftUp)

These templates are designed for the Supabase Dashboard screen shown in your screenshot:

`Authentication` -> `Email` -> `Templates`

Use the HTML files in this folder for:

1. Confirm sign up
2. Invite user
3. Magic link
4. Change email address
5. Reset password
6. Reauthentication

## Brand alignment

- Primary: `#1e3a5f`
- Accent: `#14b8a6`
- Background: `#f8fafc`
- Card border: `#e2e8f0`
- Body text: `#334155`
- Logo image used in all templates: `https://www.getswyftup.com/icon-192.png`

## Required Supabase URL settings

In Supabase:

`Authentication` -> `URL Configuration`

Set:

- Site URL: `https://www.getswyftup.com`
- Redirect URLs (at minimum):
  - `https://www.getswyftup.com/login`
  - `https://www.getswyftup.com/login?mode=reset`
  - `https://www.getswyftup.com/app`

If you use staging/preview domains, add those exact URLs too.

## Link variable

All templates in this folder use:

- `{{ .ConfirmationURL }}`

Do not replace it with a hardcoded URL.

## Quick validation checklist

After saving each template:

1. Send a reset password email from `/login` in the app.
2. Open the email and click the button.
3. Confirm it lands on `https://www.getswyftup.com/login?mode=reset...` and shows the reset form.
4. Complete reset and confirm login works.
5. Repeat for invite and magic link flows.
