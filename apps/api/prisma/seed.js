import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: "tnt_demo" },
    update: {},
    create: {
      id: "tnt_demo",
      name: "Demo Realty",
      allowedOrigins: [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://agentswyftup.up.railway.app",
        "https://widgetswyftup.up.railway.app",
      ],
    },
  });

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const agent = await prisma.agent.upsert({
    where: { email: "agent@example.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "agent@example.com",
      passwordHash,
      name: "Demo Agent",
    },
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
