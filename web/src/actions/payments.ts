"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function createPayment(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permPaie) throw new Error("Permission refusée");

  const patientId = String(formData.get("patientId"));
  const amount = Number(formData.get("amount"));
  const method = String(formData.get("method") ?? "CASH");
  const consultationId = String(formData.get("consultationId") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!patientId || Number.isNaN(amount)) throw new Error("Données invalides");

  await prisma.payment.create({
    data: {
      patientId,
      amount,
      method,
      consultationId: consultationId || null,
      note,
    },
  });

  await logAudit(session.user.id, "CREATE", "Payment", { patientId, amount });
  revalidatePath("/dashboard/payments");
  revalidatePath(`/dashboard/patients/${patientId}`);
}
