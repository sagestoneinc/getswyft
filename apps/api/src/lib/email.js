import { env } from "../config/env.js";
import { logger } from "./logger.js";

function buildInviteHtml({ tenantName, inviterName, inviteUrl, roleName }) {
  return `
    <div style="font-family: Inter, Arial, sans-serif; color: #0f172a; line-height: 1.5;">
      <h2 style="margin-bottom: 12px;">You're invited to join ${tenantName} on Getswyft</h2>
      <p>${inviterName} invited you to join the workspace as <strong>${roleName}</strong>.</p>
      <p style="margin: 24px 0;">
        <a href="${inviteUrl}" style="background:#0f766e;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;display:inline-block;">
          Accept invitation
        </a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${inviteUrl}">${inviteUrl}</a></p>
      <p style="color:#64748b;font-size:12px;">This invitation will expire in 7 days.</p>
    </div>
  `;
}

function buildInviteText({ tenantName, inviterName, inviteUrl, roleName }) {
  return [
    `You're invited to join ${tenantName} on Getswyft.`,
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

  return sendWithLog(payload);
}

export async function sendTeamInviteEmail({ email, tenantName, inviterName, inviteUrl, roleName }) {
  return sendEmail({
    to: [email],
    subject: `You're invited to ${tenantName} on Getswyft`,
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
