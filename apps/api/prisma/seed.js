import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: "default" },
    update: {
      allowedOrigins: [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://widgetswyftup.up.railway.app",
        "https://agentswyftup.up.railway.app"
      ]
    },
    create: {
      id: "default",
      name: "Demo Realty",
      allowedOrigins: [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://widgetswyftup.up.railway.app",
        "https://agentswyftup.up.railway.app"
      ]
    }
  });

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const agent = await prisma.agent.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "agent@example.com" } },
    update: { passwordHash, name: "Demo Agent" },
    create: {
      tenantId: tenant.id,
      email: "agent@example.com",
      passwordHash,
      name: "Demo Agent"
    }
  });

  const defaultOfficeHours = {
    mon: { start: "09:00", end: "18:00" },
    tue: { start: "09:00", end: "18:00" },
    wed: { start: "09:00", end: "18:00" },
    thu: { start: "09:00", end: "18:00" },
    fri: { start: "09:00", end: "18:00" },
  };

  await prisma.routingSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      mode: "first_available",
      timezone: "Asia/Manila",
      officeHours: defaultOfficeHours,
      fallbackAgentId: agent.id,
    }
  });

  console.log("Seeded tenant:", tenant.id);
  console.log("Seeded agent :", agent.id, agent.email);
  console.log("Password     : Password123!");
  console.log("Seeded routing settings for tenant:", tenant.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
