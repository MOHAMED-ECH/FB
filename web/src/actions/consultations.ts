"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addMinutes, endOfDay, startOfDay } from "date-fns";
import { z } from "zod";
import { AppointmentStatus, ConsultationType, InvoiceStatus, WaitingStatus } from "@prisma/client";
import { requireDoctor } from "@/lib/authorization";
import { invoiceStatus } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { formValue, longText, nonEmptyText } from "@/lib/forms";

const consultationSchema = z.object({
  patientId: nonEmptyText,
  type: z.enum(["FIRST", "CONTROL", "OTHER"]).default("OTHER"),
  notes: longText,
  invoiceAmount: z.coerce.number().positive().max(100000),
  nextAppointmentStart: z.string().trim().optional(),
  nextMotif: z.string().trim().max(300).optional(),
  nextDuration: z.coerce.number().int().min(5).max(240).default(30),
});

const consultationUpdateSchema = z.object({
  patientId: nonEmptyText,
  consultationId: nonEmptyText,
  type: z.enum(["FIRST", "CONTROL", "OTHER"]).default("OTHER"),
  notes: longText,
  invoiceAmount: z.coerce.number().positive().max(100000),
});

const consultationLabels: Record<"FIRST" | "CONTROL" | "OTHER", string> = {
  FIRST: "Première consultation",
  CONTROL: "Consultation de contrôle",
  OTHER: "Consultation",
};

export async function createConsultation(formData: FormData) {
  const user = await requireDoctor();
  const data = consultationSchema.parse({
    patientId: formValue(formData, "patientId"),
    type: formValue(formData, "type") || "OTHER",
    notes: formValue(formData, "notes"),
    invoiceAmount: formValue(formData, "invoiceAmount"),
    nextAppointmentStart: formValue(formData, "nextAppointmentStart"),
    nextMotif: formValue(formData, "nextMotif"),
    nextDuration: formValue(formData, "nextDuration") || "30",
  });

  const wantsNextAppointment = Boolean(data.nextAppointmentStart || data.nextMotif);
  let nextAppointment:
    | {
        start: Date;
        end: Date;
        motif: string;
      }
    | null = null;

  if (wantsNextAppointment) {
    if (!data.nextAppointmentStart || !data.nextMotif) {
      throw new Error("Le prochain RDV doit contenir une date et un motif.");
    }

    const start = new Date(data.nextAppointmentStart);
    if (Number.isNaN(start.getTime())) {
      throw new Error("Date du prochain RDV invalide.");
    }
    if (start <= new Date()) {
      throw new Error("Le prochain RDV doit être planifié dans le futur.");
    }

    const end = addMinutes(start, data.nextDuration);

    nextAppointment = {
      start,
      end,
      motif: data.nextMotif,
    };
  }

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  await prisma.$transaction(async (tx) => {
    const consultation = await tx.consultation.create({
      data: {
        patientId: data.patientId,
        doctorId: user.id,
        type: data.type as ConsultationType,
        notes: data.notes,
      },
    });

    await tx.consultationInvoice.create({
      data: {
        patientId: data.patientId,
        consultationId: consultation.id,
        label: consultationLabels[data.type],
        expectedAmount: data.invoiceAmount,
        status: InvoiceStatus.UNPAID,
      },
    });

    if (nextAppointment) {
      const overlap = await tx.appointment.findFirst({
        where: {
          status: AppointmentStatus.SCHEDULED,
          start: { lt: nextAppointment.end },
          end: { gt: nextAppointment.start },
        },
        select: { id: true },
      });
      if (overlap) {
        throw new Error("Le creneau du prochain RDV est deja occupe.");
      }

      await tx.appointment.create({
        data: {
          patientId: data.patientId,
          start: nextAppointment.start,
          end: nextAppointment.end,
          type: ConsultationType.CONTROL,
          motif: nextAppointment.motif,
        },
      });
    }

    const activeWaiting =
      (await tx.waitingEntry.findFirst({
        where: {
          patientId: data.patientId,
          day: { gte: todayStart, lte: todayEnd },
          status: WaitingStatus.IN_PROGRESS,
        },
        orderBy: { arrivedAt: "desc" },
        select: { id: true },
      })) ??
      (await tx.waitingEntry.findFirst({
        where: {
          patientId: data.patientId,
          day: { gte: todayStart, lte: todayEnd },
          status: WaitingStatus.WAITING,
        },
        orderBy: { arrivedAt: "desc" },
        select: { id: true },
      }));

    if (activeWaiting) {
      await tx.waitingEntry.update({
        where: { id: activeWaiting.id },
        data: { status: WaitingStatus.DONE },
      });
    }
  });

  await logAudit(user.id, "CREATE", "Consultation", { patientId: data.patientId });
  revalidatePath("/dashboard/patients");
  revalidatePath(`/dashboard/patients/${data.patientId}`);
  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard/waiting");
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard");
  redirect(`/dashboard/patients/${data.patientId}`);
}

export async function createConsultationWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await createConsultation(formData);
    return actionSuccess("Consultation enregistrée.");
  } catch (error) {
    return actionError(error);
  }
}

export async function updateConsultation(formData: FormData) {
  const user = await requireDoctor();
  const data = consultationUpdateSchema.parse({
    patientId: formValue(formData, "patientId"),
    consultationId: formValue(formData, "consultationId"),
    type: formValue(formData, "type") || "OTHER",
    notes: formValue(formData, "notes"),
    invoiceAmount: formValue(formData, "invoiceAmount"),
  });

  await prisma.$transaction(async (tx) => {
    const consultation = await tx.consultation.findFirst({
      where: {
        id: data.consultationId,
        patientId: data.patientId,
      },
      select: {
        id: true,
        invoice: { select: { id: true } },
      },
    });
    if (!consultation) throw new Error("Consultation introuvable pour ce patient.");

    await tx.consultation.update({
      where: { id: consultation.id },
      data: {
        type: data.type as ConsultationType,
        notes: data.notes,
      },
    });

    if (consultation.invoice) {
      const paid = await tx.payment.aggregate({
        where: { invoiceId: consultation.invoice.id },
        _sum: { amount: true },
      });

      await tx.consultationInvoice.update({
        where: { id: consultation.invoice.id },
        data: {
          label: consultationLabels[data.type],
          expectedAmount: data.invoiceAmount,
          status: invoiceStatus(data.invoiceAmount, paid._sum.amount ?? 0),
        },
      });
    }
  });

  await logAudit(user.id, "UPDATE", "Consultation", {
    patientId: data.patientId,
    consultationId: data.consultationId,
  });
  revalidatePath(`/dashboard/patients/${data.patientId}`);
  revalidatePath("/dashboard/payments");
}

export async function updateConsultationWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await updateConsultation(formData);
    return actionSuccess("Consultation mise à jour.");
  } catch (error) {
    return actionError(error);
  }
}
