import { env } from "../config/env.js";
import { logger } from "./logger.js";

const EMAIL_COLORS = {
  pageBackground: "#f8fafc",
  cardBackground: "#ffffff",
  border: "#e2e8f0",
  heading: "#0f172a",
  body: "#334155",
  muted: "#64748b",
  accent: "#14b8a6",
  accentForeground: "#ffffff",
  primary: "#1e3a5f",
};

const FALLBACK_LOGO_HOST = "https://www.getswyftup.com";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeUrl(value) {
  try {
    return new URL(String(value)).toString();
  } catch (_error) {
    return String(value || "");
  }
}

function resolveEmailLogoUrl() {
  const base = normalizeUrl(env.APP_BASE_URL || FALLBACK_LOGO_HOST).replace(/\/$/, "");

  try {
    return new URL("/icon-192.png", `${base}/`).toString();
  } catch (_error) {
    return `${FALLBACK_LOGO_HOST}/icon-192.png`;
  }
}

function buildActionEmailHtml({ title, lead, body, actionLabel, actionUrl, footnote }) {
  const safeTitle = escapeHtml(title);
  const safeLead = escapeHtml(lead);
  const safeBody = escapeHtml(body);
  const safeActionLabel = escapeHtml(actionLabel);
  const safeFootnote = escapeHtml(footnote);
  const normalizedUrl = normalizeUrl(actionUrl);
  const safeActionUrl = escapeHtml(normalizedUrl);
  const safeLogoUrl = escapeHtml(resolveEmailLogoUrl());

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:${EMAIL_COLORS.pageBackground};font-family:Inter,Segoe UI,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${EMAIL_COLORS.pageBackground};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;">
            <tr>
              <td style="padding:0 4px 10px 4px;">
                <img
                  src="${safeLogoUrl}"
                  alt="SwyftUp logo"
                  width="28"
                  height="28"
                  style="display:inline-block;vertical-align:middle;margin-right:8px;border-radius:6px;border:1px solid ${EMAIL_COLORS.border};"
                />
                <span style="font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_COLORS.primary};vertical-align:middle;">
                  SwyftUp
                </span>
              </td>
            </tr>
            <tr>
              <td style="background:${EMAIL_COLORS.cardBackground};border:1px solid ${EMAIL_COLORS.border};border-radius:14px;padding:28px 24px;">
                <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.3;color:${EMAIL_COLORS.heading};">${safeTitle}</h1>
                <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:${EMAIL_COLORS.body};">${safeLead}</p>
                <p style="margin:0 0 22px 0;font-size:15px;line-height:1.6;color:${EMAIL_COLORS.body};">${safeBody}</p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="border-radius:10px;background:${EMAIL_COLORS.accent};">
                      <a href="${safeActionUrl}" style="display:inline-block;padding:12px 18px;font-size:14px;font-weight:700;color:${EMAIL_COLORS.accentForeground};text-decoration:none;border-radius:10px;">
                        ${safeActionLabel}
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:20px 0 6px 0;font-size:13px;color:${EMAIL_COLORS.muted};">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:0 0 10px 0;font-size:13px;line-height:1.5;word-break:break-word;">
                  <a href="${safeActionUrl}" style="color:${EMAIL_COLORS.primary};text-decoration:underline;">${safeActionUrl}</a>
                </p>
                <p style="margin:0;font-size:12px;color:${EMAIL_COLORS.muted};">${safeFootnote}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 4px 0 4px;font-size:12px;line-height:1.5;color:${EMAIL_COLORS.muted};">
                SwyftUp · A flexible customer communication platform with chat, voice, and AI automation.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

function buildInviteHtml({ tenantName, inviterName, inviteUrl, roleName }) {
  return buildActionEmailHtml({
    title: `You're invited to join ${tenantName} on SwyftUp`,
    lead: `${inviterName} invited you to join the workspace as ${roleName}.`,
    body: "Accept your invitation to activate workspace access and start collaborating with your team.",
    actionLabel: "Accept invitation",
    actionUrl: inviteUrl,
    footnote: "This invitation link expires in 7 days.",
  });
}

function buildInviteText({ tenantName, inviterName, inviteUrl, roleName }) {
  return [
    `You're invited to join ${tenantName} on SwyftUp.`,
    "",
    `${inviterName} invited you to join the workspace as ${roleName}.`,
    "",
    `Accept invitation: ${inviteUrl}`,
    "",
    "This invitation will expire in 7 days.",
  ].join("\n");
}

async function sendWithResend(payload) {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: payload.to,
      reply_to: env.EMAIL_REPLY_TO || undefined,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      tags: payload.tags || [],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Resend request failed with ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  return {
    provider: "resend",
    messageId: result.id || null,
  };
}

function appendMailgunTag(formData, tag) {
  if (!tag || typeof tag !== "object") {
    return;
  }

  if (tag.name && tag.value) {
    formData.append("o:tag", `${tag.name}:${tag.value}`);
    return;
  }

  if (tag.name) {
    formData.append("o:tag", String(tag.name));
  }
}

async function sendWithMailgun(payload) {
  if (!env.MAILGUN_API_KEY) {
    throw new Error("MAILGUN_API_KEY is required when EMAIL_PROVIDER=mailgun");
  }

  if (!env.MAILGUN_DOMAIN) {
    throw new Error("MAILGUN_DOMAIN is required when EMAIL_PROVIDER=mailgun");
  }

  const baseUrl = normalizeUrl(env.MAILGUN_BASE_URL || "https://api.mailgun.net").replace(/\/$/, "");
  const requestUrl = `${baseUrl}/v3/${encodeURIComponent(env.MAILGUN_DOMAIN)}/messages`;

  const formData = new URLSearchParams();
  formData.append("from", env.EMAIL_FROM);
  formData.append("subject", payload.subject);
  formData.append("text", payload.text || "");

  if (payload.html) {
    formData.append("html", payload.html);
  }

  for (const recipient of payload.to || []) {
    formData.append("to", recipient);
  }

  if (env.EMAIL_REPLY_TO) {
    formData.append("h:Reply-To", env.EMAIL_REPLY_TO);
  }

  for (const tag of payload.tags || []) {
    appendMailgunTag(formData, tag);
  }

  const credentials = Buffer.from(`api:${env.MAILGUN_API_KEY}`).toString("base64");
  const response = await fetch(requestUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Mailgun request failed with ${response.status}: ${errorBody}`);
  }

  const result = await response.json().catch(() => ({}));
  return {
    provider: "mailgun",
    messageId: result.id || null,
  };
}

async function sendWithLog(payload) {
  logger.info("email_log_delivery", {
    provider: "log",
    to: payload.to,
    subject: payload.subject,
    tags: payload.tags || [],
  });

  return {
    provider: "log",
    messageId: null,
  };
}

export async function sendEmail(payload) {
  if (env.EMAIL_PROVIDER === "resend") {
    return sendWithResend(payload);
  }
  if (env.EMAIL_PROVIDER === "mailgun") {
    return sendWithMailgun(payload);
  }

  return sendWithLog(payload);
}

export async function sendTeamInviteEmail({ email, tenantName, inviterName, inviteUrl, roleName }) {
  return sendEmail({
    to: [email],
    subject: `You're invited to ${tenantName} on SwyftUp`,
    html: buildInviteHtml({
      tenantName,
      inviterName,
      inviteUrl,
      roleName,
    }),
    text: buildInviteText({
      tenantName,
      inviterName,
      inviteUrl,
      roleName,
    }),
    tags: [
      { name: "type", value: "team_invite" },
      { name: "tenant", value: tenantName },
    ],
  });
}
