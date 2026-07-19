"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { endOfDay, startOfDay } from "date-fns";
import { WaitingStatus } from "@prisma/client";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { formValue } from "@/lib/forms";

async function addToWaitingQueue(patientId: string) {
  const user = await requirePermission("permFile");
  const day = startOfDay(new Date());

  const existing = await prisma.waitingEntry.findFirst({
    where: {
      patientId,
      day,
      status: { in: [WaitingStatus.WAITING, WaitingStatus.IN_PROGRESS] },
    },
    select: { id: true },
  });
  if (existing) throw new Error("Patient déjà présent en salle d'attente");

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true },
  });
  if (!patient) throw new Error("Patient introuvable");

  await prisma.waitingEntry.create({
    data: {
      patientId,
      day,
      status: WaitingStatus.WAITING,
    },
  });
  await logAudit(user.id, "QUEUE_ADD", "WaitingEntry", { patientId });
  revalidatePath("/dashboard/waiting");
  redirect("/dashboard/waiting");
}

export async function submitAddToWaiting(formData: FormData) {
  const patientId = formValue(formData, "patientId");
  if (!patientId) throw new Error("Patient requis");
  await addToWaitingQueue(patientId);
}

export async function submitAddToWaitingWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await submitAddToWaiting(formData);
    return actionSuccess("Patient ajouté à la salle d'attente.");
  } catch (error) {
    return actionError(error);
  }
}

async function updateWaitingStatus(id: string, status: WaitingStatus) {
  const user = await requirePermission("permFile");

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  await prisma.$transaction(async (tx) => {
    const entry = await tx.waitingEntry.findUnique({
      where: { id },
      select: { status: true, day: true },
    });
    if (!entry) throw new Error("Passage introuvable");
    if (entry.day < todayStart || entry.day > todayEnd) {
      throw new Error("Seule la salle d'attente du jour peut être modifiée.");
    }

    const allowed =
      (entry.status === WaitingStatus.WAITING &&
        (status === WaitingStatus.IN_PROGRESS || status === WaitingStatus.DONE)) ||
      (entry.status === WaitingStatus.IN_PROGRESS && status === WaitingStatus.DONE);

    if (!allowed) {
      throw new Error("Transition de salle d'attente non autorisée.");
    }

    await tx.waitingEntry.update({
      where: { id },
      data: { status },
    });
  });

  await logAudit(user.id, "QUEUE_STATUS", "WaitingEntry", { id, status });
  revalidatePath("/dashboard/waiting");
}

export async function submitWaitingStatus(formData: FormData) {
  const id = formValue(formData, "id");
  const status = formValue(formData, "status") as WaitingStatus;
  if (!id || !["WAITING", "IN_PROGRESS", "DONE"].includes(status)) throw new Error("Données invalides");
  await updateWaitingStatus(id, status);
  redirect("/dashboard/waiting");
}

export async function submitWaitingStatusWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await submitWaitingStatus(formData);
    return actionSuccess("Statut mis à jour.");
  } catch (error) {
    return actionError(error);
  }
}
