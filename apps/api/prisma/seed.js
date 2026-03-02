import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: "demo-tenant-001" },
    update: {},
    create: {
      id: "demo-tenant-001",
      name: "Demo Realty",
      allowedOrigins: [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://widget.up.railway.app",
        "https://agent.up.railway.app",
      ],
    },
  });

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const agent = await prisma.agent.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "agent@demo.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "agent@demo.com",
      passwordHash,
      name: "Jane Smith",
    },
  });

  console.log("Seeded tenant:", tenant.id);
  console.log("Seeded agent :", agent.id, agent.email);
  console.log("Password     : demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
