"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isDoctor, requireUser } from "@/lib/authorization";
import { assertPaymentWithinRemaining, invoiceStatus } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { formValue, nonEmptyText, optionalString } from "@/lib/forms";

const paymentSchema = z.object({
  patientId: nonEmptyText,
  amount: z.coerce.number().positive().max(100000),
  method: z.enum(["CASH", "CARD", "CHEQUE", "TRANSFER"]),
  consultationId: optionalString,
  invoiceId: optionalString,
  note: optionalString,
});

export async function createPayment(formData: FormData) {
  const user = await requireUser();
  if (isDoctor(user) || !user.permPaie) {
    throw new Error("L'encaissement est réservé au secrétariat.");
  }
  const data = paymentSchema.parse({
    patientId: formValue(formData, "patientId"),
    amount: formValue(formData, "amount"),
    method: formValue(formData, "method") || "CASH",
    consultationId: formValue(formData, "consultationId"),
    invoiceId: formValue(formData, "invoiceId"),
    note: formValue(formData, "note"),
  });

  const patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
    select: { id: true },
  });
  if (!patient) throw new Error("Patient introuvable");

  await prisma.$transaction(async (tx) => {
    let consultationId = data.consultationId;

    if (data.invoiceId) {
      const invoice = await tx.consultationInvoice.findFirst({
        where: {
          id: data.invoiceId,
          patientId: data.patientId,
        },
        select: {
          id: true,
          consultationId: true,
          expectedAmount: true,
        },
      });
      if (!invoice) throw new Error("Facture introuvable pour ce patient.");

      if (consultationId && consultationId !== invoice.consultationId) {
        throw new Error("La consultation ne correspond pas à la facture.");
      }
      consultationId = invoice.consultationId;

      const alreadyPaid = await tx.payment.aggregate({
        where: { invoiceId: invoice.id },
        _sum: { amount: true },
      });
      const paidAmount = alreadyPaid._sum.amount ?? 0;
      assertPaymentWithinRemaining(invoice.expectedAmount, paidAmount, data.amount);

      await tx.payment.create({
        data: {
          patientId: data.patientId,
          consultationId,
          invoiceId: invoice.id,
          amount: data.amount,
          method: data.method,
          note: data.note,
        },
      });

      await tx.consultationInvoice.update({
        where: { id: invoice.id },
        data: {
          status: invoiceStatus(invoice.expectedAmount, paidAmount + data.amount),
        },
      });
      return;
    }

    throw new Error("Le paiement doit être rattaché à une facture de consultation.");
  });

  await logAudit(user.id, "CREATE", "Payment", {
    patientId: data.patientId,
    amount: data.amount,
  });
  revalidatePath("/dashboard/payments");
  revalidatePath(`/dashboard/patients/${data.patientId}`);
}

export async function createPaymentWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await createPayment(formData);
    return actionSuccess("Paiement enregistré.");
  } catch (error) {
    return actionError(error);
  }
}
