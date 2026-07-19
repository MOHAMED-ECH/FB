"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireChiefDoctor } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { checked, formValue, nonEmptyText } from "@/lib/forms";

const userSchema = z.object({
  email: z.email().trim().toLowerCase(),
  name: nonEmptyText.max(120),
  password: z.string().min(10).max(128),
  role: z.enum([Role.DOCTOR, Role.SECRETARY]).default(Role.SECRETARY),
});

function readPermissions(formData: FormData) {
  return {
    permRdv: checked(formData, "permRdv"),
    permFile: checked(formData, "permFile"),
    permPaie: checked(formData, "permPaie"),
    permPatAdm: checked(formData, "permPatAdm"),
    permPatConst: checked(formData, "permPatConst"),
    permPatMed: checked(formData, "permPatMed"),
    permStats: checked(formData, "permStats"),
  };
}

export async function createUser(formData: FormData) {
  const user = await requireChiefDoctor();
  const data = userSchema.parse({
    email: formValue(formData, "email"),
    name: formValue(formData, "name"),
    password: formValue(formData, "password"),
    role: formValue(formData, "role") || Role.SECRETARY,
  });
  const permissions =
    data.role === Role.SECRETARY
      ? readPermissions(formData)
      : {
          permRdv: true,
          permFile: true,
          permPaie: true,
          permPatAdm: true,
          permPatConst: true,
          permPatMed: true,
          permStats: true,
        };

  await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: await hashPassword(data.password),
      role: data.role,
      isChiefDoctor: false,
      ...permissions,
    },
  });

  await logAudit(user.id, "CREATE_USER", "User", { email: data.email, role: data.role });
  revalidatePath("/dashboard/users");
  redirect("/dashboard/users");
}

export async function createUserWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await createUser(formData);
    return actionSuccess("Compte créé.");
  } catch (error) {
    return actionError(error);
  }
}

async function toggleUserActive(userId: string, active: boolean) {
  const user = await requireChiefDoctor();
  if (userId === user.id) throw new Error("Impossible sur votre compte");

  await prisma.user.update({
    where: { id: userId },
    data: { active },
  });
  await logAudit(user.id, "USER_ACTIVE", "User", { userId, active });
  revalidatePath("/dashboard/users");
}

async function updateSecretaryPermissions(userId: string, formData: FormData) {
  const user = await requireChiefDoctor();
  if (userId === user.id) throw new Error("Impossible");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.role !== Role.SECRETARY) throw new Error("Utilisateur invalide");

  await prisma.user.update({
    where: { id: userId },
    data: readPermissions(formData),
  });
  await logAudit(user.id, "UPDATE_PERMS", "User", { userId });
  revalidatePath("/dashboard/users");
}

export async function submitSecretaryPermissions(formData: FormData) {
  const userId = formValue(formData, "userId");
  if (!userId) throw new Error("Utilisateur manquant");
  await updateSecretaryPermissions(userId, formData);
}

export async function submitSecretaryPermissionsWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await submitSecretaryPermissions(formData);
    return actionSuccess("Droits mis à jour.");
  } catch (error) {
    return actionError(error);
  }
}

export async function submitToggleUserActive(formData: FormData) {
  const userId = formValue(formData, "userId");
  const nextActive = formValue(formData, "nextActive") === "true";
  if (!userId) throw new Error("Utilisateur manquant");
  await toggleUserActive(userId, nextActive);
}

export async function submitToggleUserActiveWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await submitToggleUserActive(formData);
    return actionSuccess("Statut du compte mis à jour.");
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteUser(formData: FormData) {
  const user = await requireChiefDoctor();
  const userId = formValue(formData, "userId");
  if (!userId) throw new Error("Utilisateur manquant");
  if (userId === user.id) throw new Error("Impossible de supprimer votre propre compte");

  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          consultations: true,
          auditLogs: true,
        },
      },
    },
  });
  if (!target) throw new Error("Utilisateur introuvable");
  if (target.isChiefDoctor) throw new Error("Le médecin chef ne peut pas être supprimé depuis l'interface");

  if (target._count.consultations > 0 || target._count.auditLogs > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { active: false },
    });
    await logAudit(user.id, "DISABLE_USER_RETENTION", "User", {
      userId,
      email: target.email,
      role: target.role,
    });
  } else {
    await prisma.user.delete({ where: { id: userId } });
    await logAudit(user.id, "DELETE_USER", "User", { userId, email: target.email, role: target.role });
  }
  revalidatePath("/dashboard/users");
}

export async function deleteUserWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await deleteUser(formData);
    return actionSuccess("Compte supprimé ou désactivé si son historique doit être conservé.");
  } catch (error) {
    return actionError(error);
  }
}
