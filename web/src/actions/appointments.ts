"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMinutes } from "date-fns";
import { getServerSession } from "next-auth";
import { AppointmentStatus, ConsultationType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function createAppointment(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permRdv) throw new Error("Permission refusée");

  const patientId = String(formData.get("patientId"));
  const start = new Date(String(formData.get("start")));
  const duration = Number(formData.get("duration") ?? 30);
  const motif = String(formData.get("motif") ?? "").trim();
  if (!patientId || Number.isNaN(start.getTime()) || !motif) {
    throw new Error("Données invalides");
  }

  const end = addMinutes(start, duration);

  const typeRaw = String(formData.get("type") ?? "OTHER");
  const type =
    typeRaw === "FIRST" || typeRaw === "CONTROL" || typeRaw === "OTHER"
      ? (typeRaw as ConsultationType)
      : ConsultationType.OTHER;

  const overlap = await prisma.appointment.findFirst({
    where: {
      status: AppointmentStatus.SCHEDULED,
      start: { lt: end },
      end: { gt: start },
    },
  });
  if (overlap) throw new Error("Créneau déjà occupé");

  await prisma.appointment.create({
    data: {
      patientId,
      start,
      end,
      type,
      motif,
    },
  });

  await logAudit(session.user.id, "CREATE", "Appointment", { patientId });
  revalidatePath("/dashboard/agenda");
  redirect("/dashboard/agenda");
}

export async function cancelAppointment(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permRdv) throw new Error("Permission refusée");
  await prisma.appointment.update({
    where: { id },
    data: { status: AppointmentStatus.CANCELLED },
  });
  await logAudit(session.user.id, "CANCEL", "Appointment", { id });
  revalidatePath("/dashboard/agenda");
}

export async function deleteAppointment(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permRdv) throw new Error("Permission refusée");
  await prisma.appointment.delete({ where: { id } });
  await logAudit(session.user.id, "DELETE", "Appointment", { id });
  revalidatePath("/dashboard/agenda");
}

export async function submitCancelAppointment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Identifiant manquant");
  await cancelAppointment(id);
}

export async function submitDeleteAppointment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Identifiant manquant");
  await deleteAppointment(id);
}
