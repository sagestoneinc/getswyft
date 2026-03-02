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

  console.log("Seeded tenant:", tenant.id);
  console.log("Seeded agent :", agent.id, agent.email);
  console.log("Password     : Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
