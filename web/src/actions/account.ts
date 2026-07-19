"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/authorization";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { formValue, nonEmptyText } from "@/lib/forms";

const profileSchema = z.object({
  name: nonEmptyText.max(120),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10).max(128),
});

export async function updateOwnProfile(formData: FormData) {
  const user = await requireUser();
  const data = profileSchema.parse({
    name: formValue(formData, "name"),
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { name: data.name },
  });
  await logAudit(user.id, "UPDATE_PROFILE", "User", { userId: user.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/account");
}

export async function updateOwnProfileWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await updateOwnProfile(formData);
    return actionSuccess("Profil mis à jour.");
  } catch (error) {
    return actionError(error);
  }
}

export async function updateOwnPassword(formData: FormData) {
  const user = await requireUser();
  const data = passwordSchema.parse({
    currentPassword: formValue(formData, "currentPassword"),
    newPassword: formValue(formData, "newPassword"),
  });

  const freshUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true },
  });
  if (!freshUser) throw new Error("Utilisateur introuvable");

  const currentOk = await verifyPassword(data.currentPassword, freshUser.passwordHash);
  if (!currentOk) throw new Error("Mot de passe actuel incorrect.");

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(data.newPassword) },
  });
  await logAudit(user.id, "UPDATE_PASSWORD", "User", { userId: user.id });
}

export async function updateOwnPasswordWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await updateOwnPassword(formData);
    return actionSuccess("Mot de passe mis à jour.");
  } catch (error) {
    return actionError(error);
  }
}
