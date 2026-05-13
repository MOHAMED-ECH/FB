import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const doctorHash = await bcrypt.hash("Admin123!", 12);
  const secHash = await bcrypt.hash("Secret123!", 12);

  await prisma.user.upsert({
    where: { email: "medecin@cabinet.local" },
    update: {},
    create: {
      email: "medecin@cabinet.local",
      passwordHash: doctorHash,
      name: "Dr. Administrateur",
      role: Role.DOCTOR,
      active: true,
      permRdv: true,
      permFile: true,
      permPaie: true,
      permPatAdm: true,
      permPatConst: true,
      permPatMed: true,
      permStats: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "secretaire@cabinet.local" },
    update: {},
    create: {
      email: "secretaire@cabinet.local",
      passwordHash: secHash,
      name: "Secrétaire",
      role: Role.SECRETARY,
      active: true,
      permRdv: true,
      permFile: true,
      permPaie: true,
      permPatAdm: true,
      permPatConst: false,
      permPatMed: false,
      permStats: true,
    },
  });

  const tarifs = [
    { label: "Consultation", amount: 60 },
    { label: "Contrôle", amount: 45 },
    { label: "Première consultation", amount: 80 },
  ];
  for (const t of tarifs) {
    const existing = await prisma.tarif.findFirst({ where: { label: t.label } });
    if (!existing) await prisma.tarif.create({ data: t });
  }

  console.log("Seed OK — comptes : medecin@cabinet.local / Admin123! | secretaire@cabinet.local / Secret123!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
