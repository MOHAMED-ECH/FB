"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function uploadMedicalDocument(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "DOCTOR" && !session?.user.permPatMed) {
    throw new Error("Permission refusée");
  }

  const patientId = String(formData.get("patientId") ?? "");
  const docType = String(formData.get("docType") ?? "Autre").trim();
  const title = String(formData.get("title") ?? "").trim() || null;
  const examDateRaw = String(formData.get("examDate") ?? "").trim();
  const file = formData.get("file");

  if (!patientId || !(file instanceof File) || file.size === 0) {
    throw new Error("Fichier et patient requis");
  }
  if (file.size > 15 * 1024 * 1024) throw new Error("Fichier trop volumineux (max 15 Mo)");

  const medical = await prisma.patientMedical.findUnique({ where: { patientId } });
  if (!medical) throw new Error("Dossier médical introuvable");

  const uploadDir = path.join(/* turbopackIgnore: true */ process.cwd(), "storage", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const safe = `${Date.now()}_${file.name.replace(/[^\w.\-]/g, "_")}`;
  const diskPath = path.join(/* turbopackIgnore: true */ uploadDir, safe);
  const relPath = path.join("storage", "uploads", safe).replace(/\\/g, "/");

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buf);

  await prisma.medicalDocument.create({
    data: {
      medicalId: medical.id,
      docType,
      title,
      examDate: examDateRaw ? new Date(examDateRaw) : null,
      fileName: file.name,
      filePath: relPath,
    },
  });

  await logAudit(session.user.id, "UPLOAD_DOC", "MedicalDocument", { patientId, docType });
  revalidatePath(`/dashboard/patients/${patientId}`);
}
