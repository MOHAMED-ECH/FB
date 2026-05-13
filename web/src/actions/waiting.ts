"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { startOfDay } from "date-fns";
import { getServerSession } from "next-auth";
import { WaitingStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function addToWaitingQueue(patientId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permFile) throw new Error("Permission refusée");
  const day = new Date();
  await prisma.waitingEntry.create({
    data: {
      patientId,
      day: startOfDay(day),
      status: WaitingStatus.WAITING,
    },
  });
  await logAudit(session.user.id, "QUEUE_ADD", "WaitingEntry", { patientId });
  revalidatePath("/dashboard/waiting");
  redirect("/dashboard/waiting");
}

export async function submitAddToWaiting(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  if (!patientId) throw new Error("Patient requis");
  await addToWaitingQueue(patientId);
}

export async function updateWaitingStatus(id: string, status: WaitingStatus) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permFile) throw new Error("Permission refusée");
  await prisma.waitingEntry.update({
    where: { id },
    data: { status },
  });
  await logAudit(session.user.id, "QUEUE_STATUS", "WaitingEntry", { id, status });
  revalidatePath("/dashboard/waiting");
}

export async function submitWaitingStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as WaitingStatus;
  if (!id || !["WAITING", "IN_PROGRESS", "DONE"].includes(status)) throw new Error("Données invalides");
  await updateWaitingStatus(id, status);
  redirect("/dashboard/waiting");
}
