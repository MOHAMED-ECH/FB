import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = process.argv[2] || process.env.CHIEF_DOCTOR_NEW_PASSWORD;
  const email = process.env.CHIEF_DOCTOR_EMAIL || "medecin@cabinet.local";

  if (!password || password.length < 10) {
    throw new Error("Indiquez un nouveau mot de passe de 10 caractères minimum.");
  }

  const chief = await prisma.user.findFirst({
    where: {
      email,
      role: Role.DOCTOR,
      isChiefDoctor: true,
    },
    select: { id: true, email: true },
  });

  if (!chief) {
    throw new Error(`Aucun médecin chef actif trouvé pour ${email}.`);
  }

  await prisma.user.update({
    where: { id: chief.id },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      active: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: chief.id,
      action: "RESET_CHIEF_PASSWORD",
      resource: "User",
      meta: JSON.stringify({ email: chief.email, source: "local-script" }),
    },
  });

  console.log(`Mot de passe du médecin chef réinitialisé pour ${chief.email}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
