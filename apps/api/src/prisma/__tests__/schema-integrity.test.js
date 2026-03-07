import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schemaPath = resolve(process.cwd(), "prisma/schema.prisma");
const schema = readFileSync(schemaPath, "utf8");

function getModelBlock(modelName) {
  const match = schema.match(new RegExp(`model\\s+${modelName}\\s+\\{([\\s\\S]*?)\\n\\}`, "m"));
  expect(match, `Expected model ${modelName} to exist in schema.prisma`).toBeTruthy();
  return match ? match[1] : "";
}

function expectRegex(value, regex, message) {
  expect(value, message).toMatch(regex);
}

describe("Prisma schema integrity", () => {
  it("preserves required unique constraints", () => {
    expectRegex(schema, /model\s+Tenant\s+\{[\s\S]*?slug\s+String\s+@unique[\s\S]*?\n\}/m, "Tenant.slug should be unique");
    expectRegex(schema, /model\s+User\s+\{[\s\S]*?externalAuthId\s+String\s+@unique[\s\S]*?\n\}/m, "User.externalAuthId should be unique");
    expectRegex(schema, /model\s+UserRole\s+\{[\s\S]*?@@unique\(\[tenantId,\s*userId,\s*roleId\]\)[\s\S]*?\n\}/m, "UserRole should enforce unique tenant/user/role tuples");
    expectRegex(schema, /model\s+MessageReceipt\s+\{[\s\S]*?@@unique\(\[messageId,\s*userId\]\)[\s\S]*?\n\}/m, "MessageReceipt should enforce one receipt per message/user");
    expectRegex(schema, /model\s+MessageReaction\s+\{[\s\S]*?@@unique\(\[messageId,\s*userId,\s*emoji\]\)[\s\S]*?\n\}/m, "MessageReaction should enforce one emoji reaction per message/user");
    expectRegex(schema, /model\s+BillingSubscription\s+\{[\s\S]*?tenantId\s+String\s+@unique[\s\S]*?\n\}/m, "BillingSubscription should enforce one subscription per tenant");
    expectRegex(schema, /model\s+BillingInvoice\s+\{[\s\S]*?invoiceNumber\s+String\s+@unique[\s\S]*?\n\}/m, "BillingInvoice.invoiceNumber should be unique");
    expectRegex(schema, /model\s+NotificationDevice\s+\{[\s\S]*?token\s+String\s+@unique[\s\S]*?\n\}/m, "NotificationDevice.token should be unique");
  });

  it("keeps cascade and set-null onDelete behaviors for key relations", () => {
    const tenantRoutingSettings = getModelBlock("TenantRoutingSettings");
    expectRegex(tenantRoutingSettings, /fallbackUser\s+User\?\s+@relation\([^)]+onDelete:\s*SetNull[^)]*\)/, "TenantRoutingSettings.fallbackUser should use SetNull");
    expectRegex(tenantRoutingSettings, /tenant\s+Tenant\s+@relation\([^)]+onDelete:\s*Cascade[^)]*\)/, "TenantRoutingSettings.tenant should use Cascade");

    const auditLog = getModelBlock("AuditLog");
    expectRegex(auditLog, /actor\s+User\?\s+@relation\([^)]+onDelete:\s*SetNull[^)]*\)/, "AuditLog.actor should use SetNull");

    const conversation = getModelBlock("Conversation");
    expectRegex(conversation, /assignedUser\s+User\?\s+@relation\([^)]+onDelete:\s*SetNull[^)]*\)/, "Conversation.assignedUser should use SetNull");
    expectRegex(conversation, /tenant\s+Tenant\s+@relation\([^)]+onDelete:\s*Cascade[^)]*\)/, "Conversation.tenant should use Cascade");

    const conversationMessage = getModelBlock("ConversationMessage");
    expectRegex(conversationMessage, /conversation\s+Conversation\s+@relation\([^)]+onDelete:\s*Cascade[^)]*\)/, "ConversationMessage.conversation should use Cascade");
    expectRegex(conversationMessage, /senderUser\s+User\?\s+@relation\([^)]+onDelete:\s*SetNull[^)]*\)/, "ConversationMessage.senderUser should use SetNull");
    expectRegex(conversationMessage, /parentMessage\s+ConversationMessage\?\s+@relation\([^)]+onDelete:\s*SetNull[^)]*\)/, "ConversationMessage.parentMessage should use SetNull");

    const invitations = getModelBlock("TenantInvitation");
    expectRegex(invitations, /acceptedUser\s+User\?\s+@relation\([^)]+onDelete:\s*SetNull[^)]*\)/, "TenantInvitation.acceptedUser should use SetNull");
  });

  it("keeps tenant-scoped relations and tenant indexes across tenant-bound models", () => {
    const tenantBoundModels = [
      "TenantFeatureFlag",
      "UserRole",
      "PresenceSession",
      "Conversation",
      "TenantInvitation",
      "WebhookEndpoint",
      "WebhookDelivery",
      "BillingInvoice",
      "Notification",
      "NotificationDevice",
      "AuditLog",
      "AnalyticsEvent",
      "AIConfig",
      "ModerationReport",
    ];

    for (const modelName of tenantBoundModels) {
      const block = getModelBlock(modelName);
      expectRegex(block, /tenantId\s+String/, `${modelName} should have tenantId`);
      expectRegex(block, /tenant\s+Tenant\s+@relation\(\s*fields:\s*\[tenantId\]/, `${modelName} should relate to Tenant via tenantId`);
      expectRegex(
        block,
        /@@(index|unique)\(\[tenantId(?:,|\])/,
        `${modelName} should keep a tenantId index/unique composite for tenant-scoped access`,
      );
    }
  });

  it("keeps role-permission linkage intact", () => {
    const role = getModelBlock("Role");
    const permission = getModelBlock("Permission");
    const rolePermission = getModelBlock("RolePermission");

    expectRegex(role, /permissions\s+RolePermission\[\]/, "Role should reference RolePermission join table");
    expectRegex(permission, /rolePermissions\s+RolePermission\[\]/, "Permission should reference RolePermission join table");
    expectRegex(rolePermission, /@@id\(\[roleId,\s*permissionId\]\)/, "RolePermission should use a composite primary key");
    expectRegex(rolePermission, /role\s+Role\s+@relation\([^)]+onDelete:\s*Cascade[^)]*\)/, "RolePermission.role relation should use Cascade");
    expectRegex(rolePermission, /permission\s+Permission\s+@relation\([^)]+onDelete:\s*Cascade[^)]*\)/, "RolePermission.permission relation should use Cascade");
  });

  it("keeps conversation, message, and receipt integrity constraints", () => {
    const conversation = getModelBlock("Conversation");
    const message = getModelBlock("ConversationMessage");
    const receipt = getModelBlock("MessageReceipt");

    expectRegex(conversation, /messages\s+ConversationMessage\[\]/, "Conversation should expose messages relation");
    expectRegex(message, /conversationId\s+String/, "ConversationMessage should require conversationId");
    expectRegex(message, /conversation\s+Conversation\s+@relation\([^)]+onDelete:\s*Cascade[^)]*\)/, "ConversationMessage should cascade on conversation delete");
    expectRegex(message, /receipts\s+MessageReceipt\[\]/, "ConversationMessage should expose receipts relation");
    expectRegex(receipt, /@@unique\(\[messageId,\s*userId\]\)/, "MessageReceipt should enforce unique message/user receipt");
    expectRegex(receipt, /message\s+ConversationMessage\s+@relation\([^)]+onDelete:\s*Cascade[^)]*\)/, "MessageReceipt.message relation should use Cascade");
    expectRegex(receipt, /user\s+User\s+@relation\([^)]+onDelete:\s*Cascade[^)]*\)/, "MessageReceipt.user relation should use Cascade");
  });

  it("keeps billing subscription and invoice linkage intact", () => {
    const subscription = getModelBlock("BillingSubscription");
    const invoice = getModelBlock("BillingInvoice");

    expectRegex(subscription, /tenantId\s+String\s+@unique/, "BillingSubscription should keep a unique tenantId");
    expectRegex(subscription, /invoices\s+BillingInvoice\[\]/, "BillingSubscription should expose invoices relation");
    expectRegex(invoice, /subscriptionId\s+String/, "BillingInvoice should include subscriptionId");
    expectRegex(invoice, /subscription\s+BillingSubscription\s+@relation\([^)]+onDelete:\s*Cascade[^)]*\)/, "BillingInvoice.subscription relation should use Cascade");
    expectRegex(invoice, /tenant\s+Tenant\s+@relation\([^)]+onDelete:\s*Cascade[^)]*\)/, "BillingInvoice.tenant relation should use Cascade");
    expectRegex(invoice, /@@index\(\[tenantId,\s*issuedAt\]\)/, "BillingInvoice should keep tenant/issuedAt index");
    expectRegex(invoice, /@@index\(\[subscriptionId,\s*issuedAt\]\)/, "BillingInvoice should keep subscription/issuedAt index");
  });
});
