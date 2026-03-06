import { getPrismaClient } from "./db.js";

export async function recordAnalyticsEvent(req, input) {
  const prisma = getPrismaClient();

  if (!req.tenant?.id) {
    return null;
  }

  return prisma.analyticsEvent.create({
    data: {
      tenantId: req.tenant.id,
      userId: req.auth?.user?.id || null,
      eventName: input.eventName,
      eventCategory: input.eventCategory || null,
      value: typeof input.value === "number" ? input.value : null,
      metadata: input.metadata || null,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
    },
  });
}
