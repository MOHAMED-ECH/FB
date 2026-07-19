import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Role, type User } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuthenticatedUser = User;

type Permission =
  | "permRdv"
  | "permFile"
  | "permPaie"
  | "permPatAdm"
  | "permPatConst"
  | "permPatMed"
  | "permStats";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;

  return prisma.user.findFirst({
    where: { id, active: true },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non authentifié");
  return user;
}

export async function requirePageUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function isDoctor(user: Pick<User, "role">) {
  return user.role === Role.DOCTOR;
}

export function isChiefDoctor(user: Pick<User, "role" | "isChiefDoctor">) {
  return isDoctor(user) && user.isChiefDoctor;
}

export function hasPermission(user: Pick<User, Permission | "role">, permission: Permission) {
  return isDoctor(user) || user[permission];
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!hasPermission(user, permission)) throw new Error("Permission refusée");
  return user;
}

export async function requireDoctor() {
  const user = await requireUser();
  if (!isDoctor(user)) throw new Error("Réservé au médecin");
  return user;
}

export async function requireChiefDoctor() {
  const user = await requireUser();
  if (!isChiefDoctor(user)) throw new Error("Réservé au médecin chef");
  return user;
}
