"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMinutes } from "date-fns";
import { z } from "zod";
import { AppointmentStatus, ConsultationType } from "@prisma/client";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { dateTimeFromForm, formValue, nonEmptyText } from "@/lib/forms";

const appointmentSchema = z.object({
  patientId: nonEmptyText,
  start: dateTimeFromForm,
  duration: z.coerce.number().int().min(5).max(240),
  motif: nonEmptyText.max(300),
  type: z.enum(["FIRST", "CONTROL", "OTHER"]).default("OTHER"),
});

export async function createAppointment(formData: FormData) {
  const user = await requirePermission("permRdv");
  const data = appointmentSchema.parse({
    patientId: formValue(formData, "patientId"),
    start: formValue(formData, "start"),
    duration: formValue(formData, "duration") || "30",
    motif: formValue(formData, "motif"),
    type: formValue(formData, "type") || "OTHER",
  });

  if (data.start <= new Date()) {
    throw new Error("Le rendez-vous doit être planifié dans le futur.");
  }

  const end = addMinutes(data.start, data.duration);

  await prisma.$transaction(async (tx) => {
    const patient = await tx.patient.findUnique({
      where: { id: data.patientId },
      select: { id: true },
    });
    if (!patient) throw new Error("Patient introuvable");

    const overlap = await tx.appointment.findFirst({
      where: {
        status: AppointmentStatus.SCHEDULED,
        start: { lt: end },
        end: { gt: data.start },
      },
      select: { id: true },
    });
    if (overlap) throw new Error("Créneau déjà occupé");

    await tx.appointment.create({
      data: {
        patientId: data.patientId,
        start: data.start,
        end,
        type: data.type as ConsultationType,
        motif: data.motif,
      },
    });
  });

  await logAudit(user.id, "CREATE", "Appointment", { patientId: data.patientId });
  revalidatePath("/dashboard/agenda");
  redirect("/dashboard/agenda");
}

export async function createAppointmentWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await createAppointment(formData);
    return actionSuccess("Rendez-vous enregistré.");
  } catch (error) {
    return actionError(error);
  }
}

async function cancelAppointment(id: string) {
  const user = await requirePermission("permRdv");
  await prisma.appointment.update({
    where: { id },
    data: { status: AppointmentStatus.CANCELLED },
  });
  await logAudit(user.id, "CANCEL", "Appointment", { id });
  revalidatePath("/dashboard/agenda");
}

async function deleteAppointment(id: string) {
  const user = await requirePermission("permRdv");
  await prisma.appointment.delete({ where: { id } });
  await logAudit(user.id, "DELETE", "Appointment", { id });
  revalidatePath("/dashboard/agenda");
}

export async function submitCancelAppointment(formData: FormData) {
  const id = formValue(formData, "id");
  if (!id) throw new Error("Identifiant manquant");
  await cancelAppointment(id);
}

export async function submitCancelAppointmentWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await submitCancelAppointment(formData);
    return actionSuccess("Rendez-vous annulé.");
  } catch (error) {
    return actionError(error);
  }
}

export async function submitDeleteAppointment(formData: FormData) {
  const id = formValue(formData, "id");
  if (!id) throw new Error("Identifiant manquant");
  await deleteAppointment(id);
}

export async function submitDeleteAppointmentWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await submitDeleteAppointment(formData);
    return actionSuccess("Rendez-vous supprimé.");
  } catch (error) {
    return actionError(error);
  }
}
