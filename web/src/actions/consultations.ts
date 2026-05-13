"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMinutes } from "date-fns";
import { getServerSession } from "next-auth";
import { ConsultationType, AppointmentStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function createConsultation(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "DOCTOR") throw new Error("Réservé au médecin");

  const patientId = String(formData.get("patientId"));
  const typeRaw = String(formData.get("type") ?? "OTHER");
  const type =
    typeRaw === "FIRST" || typeRaw === "CONTROL" || typeRaw === "OTHER"
      ? (typeRaw as ConsultationType)
      : ConsultationType.OTHER;
  const notes = String(formData.get("notes") ?? "");
  const nextStartRaw = String(formData.get("nextAppointmentStart") ?? "").trim();
  const nextMotif = String(formData.get("nextMotif") ?? "").trim();
  const nextDuration = Number(formData.get("nextDuration") ?? 30);

  if (!patientId) throw new Error("Patient requis");

  await prisma.consultation.create({
    data: {
      patientId,
      doctorId: session.user.id,
      type,
      notes,
    },
  });

  if (nextStartRaw && nextMotif) {
    const start = new Date(nextStartRaw);
    if (!Number.isNaN(start.getTime())) {
      const end = addMinutes(start, nextDuration);
      const overlap = await prisma.appointment.findFirst({
        where: {
          status: AppointmentStatus.SCHEDULED,
          start: { lt: end },
          end: { gt: start },
        },
      });
      if (!overlap) {
        await prisma.appointment.create({
          data: {
            patientId,
            start,
            end,
            type: ConsultationType.CONTROL,
            motif: nextMotif,
          },
        });
      }
    }
  }

  await logAudit(session.user.id, "CREATE", "Consultation", { patientId });
  revalidatePath("/dashboard/patients");
  revalidatePath(`/dashboard/patients/${patientId}`);
  revalidatePath("/dashboard/agenda");
  redirect(`/dashboard/patients/${patientId}`);
}
