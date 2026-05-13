"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";

function permOn(formData: FormData, key: string) {
  return formData.getAll(key).includes("true");
}

export async function createSecretaryUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== Role.DOCTOR) throw new Error("Réservé au médecin");

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !name || password.length < 8) {
    throw new Error("Email, nom et mot de passe (8+ car.) requis");
  }

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
      role: Role.SECRETARY,
      permRdv: permOn(formData, "permRdv"),
      permFile: permOn(formData, "permFile"),
      permPaie: permOn(formData, "permPaie"),
      permPatAdm: permOn(formData, "permPatAdm"),
      permPatConst: permOn(formData, "permPatConst"),
      permPatMed: permOn(formData, "permPatMed"),
      permStats: permOn(formData, "permStats"),
    },
  });

  await logAudit(session.user.id, "CREATE_USER", "User", { email });
  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
}

export async function toggleUserActive(userId: string, active: boolean) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== Role.DOCTOR) throw new Error("Réservé au médecin");
  if (userId === session.user.id) throw new Error("Impossible sur votre compte");

  await prisma.user.update({
    where: { id: userId },
    data: { active },
  });
  await logAudit(session.user.id, "USER_ACTIVE", "User", { userId, active });
  revalidatePath("/dashboard/users");
}

export async function updateSecretaryPermissions(userId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== Role.DOCTOR) throw new Error("Réservé au médecin");
  if (userId === session.user.id) throw new Error("Impossible");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role !== Role.SECRETARY) throw new Error("Utilisateur invalide");

  await prisma.user.update({
    where: { id: userId },
    data: {
      permRdv: permOn(formData, "permRdv"),
      permFile: permOn(formData, "permFile"),
      permPaie: permOn(formData, "permPaie"),
      permPatAdm: permOn(formData, "permPatAdm"),
      permPatConst: permOn(formData, "permPatConst"),
      permPatMed: permOn(formData, "permPatMed"),
      permStats: permOn(formData, "permStats"),
    },
  });
  await logAudit(session.user.id, "UPDATE_PERMS", "User", { userId });
  revalidatePath("/dashboard/users");
}

export async function submitSecretaryPermissions(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("Utilisateur manquant");
  await updateSecretaryPermissions(userId, formData);
}

export async function submitToggleUserActive(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const nextActive = String(formData.get("nextActive") ?? "") === "true";
  if (!userId) throw new Error("Utilisateur manquant");
  await toggleUserActive(userId, nextActive);
}
