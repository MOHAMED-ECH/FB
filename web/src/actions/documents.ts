"use server";

import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasPermission, requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { formValue, nonEmptyText, optionalDateFromForm, optionalString } from "@/lib/forms";

const allowedUploads = new Map([
  ["application/pdf", ".pdf"],
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
]);

const documentSchema = z.object({
  patientId: nonEmptyText,
  docType: nonEmptyText.max(80),
  title: optionalString,
  examDate: optionalDateFromForm,
});

export type UploadMedicalDocumentState = {
  ok: boolean;
  message?: string;
  error?: string;
};

function extensionFor(file: File) {
  const ext = allowedUploads.get(file.type);
  if (ext) return ext;

  const fromName = path.extname(file.name).toLowerCase();
  if ([".pdf", ".png", ".jpg", ".jpeg"].includes(fromName)) {
    return fromName === ".jpeg" ? ".jpg" : fromName;
  }
  return null;
}

export async function uploadMedicalDocument(
  _previousState: UploadMedicalDocumentState,
  formData: FormData
): Promise<UploadMedicalDocumentState> {
  const user = await requireUser();
  if (!hasPermission(user, "permPatMed")) {
    return { ok: false, error: "Vous n’avez pas le droit de téléverser un document médical." };
  }

  const parsed = documentSchema.safeParse({
    patientId: formValue(formData, "patientId"),
    docType: formValue(formData, "docType") || "Autre",
    title: formValue(formData, "title"),
    examDate: formValue(formData, "examDate"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Merci de vérifier les informations du document." };
  }

  const data = parsed.data;
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Veuillez choisir un fichier à téléverser." };
  }
  if (file.size > 15 * 1024 * 1024) {
    return { ok: false, error: "Le fichier est trop volumineux. La taille maximale est de 15 Mo." };
  }

  const ext = extensionFor(file);
  if (!ext) {
    return { ok: false, error: "Format non autorisé. Utilisez uniquement un fichier PDF, PNG, JPG ou JPEG." };
  }

  const medical = await prisma.patientMedical.findUnique({ where: { patientId: data.patientId } });
  if (!medical) return { ok: false, error: "Dossier médical introuvable." };

  const uploadDir = path.join(/* turbopackIgnore: true */ process.cwd(), "storage", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const safe = `${Date.now()}_${randomUUID()}${ext}`;
  const diskPath = path.join(uploadDir, safe);
  const relPath = path.join("storage", "uploads", safe).replace(/\\/g, "/");

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buf, { flag: "wx" });

  await prisma.medicalDocument.create({
    data: {
      medicalId: medical.id,
      docType: data.docType,
      title: data.title,
      examDate: data.examDate,
      fileName: file.name,
      filePath: relPath,
    },
  });

  await logAudit(user.id, "UPLOAD_DOC", "MedicalDocument", {
    patientId: data.patientId,
    docType: data.docType,
    size: file.size,
    mime: file.type,
  });
  revalidatePath(`/dashboard/patients/${data.patientId}`);
  return { ok: true, message: "Document téléversé avec succès." };
}

export async function deleteMedicalDocument(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "permPatMed")) throw new Error("Permission refusée");

  const data = z
    .object({
      patientId: nonEmptyText,
      documentId: nonEmptyText,
    })
    .parse({
      patientId: formValue(formData, "patientId"),
      documentId: formValue(formData, "documentId"),
    });

  const doc = await prisma.medicalDocument.findFirst({
    where: {
      id: data.documentId,
      medical: { patientId: data.patientId },
    },
    select: { id: true, filePath: true, fileName: true, docType: true },
  });
  if (!doc) throw new Error("Document introuvable pour ce patient.");

  await prisma.medicalDocument.delete({ where: { id: doc.id } });

  const uploadRoot = path.join(/* turbopackIgnore: true */ process.cwd(), "storage", "uploads");
  const abs = path.resolve(/* turbopackIgnore: true */ process.cwd(), doc.filePath);
  const relative = path.relative(uploadRoot, abs);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
    await unlink(abs).catch(() => undefined);
  }

  await logAudit(user.id, "DELETE_DOC", "MedicalDocument", {
    patientId: data.patientId,
    documentId: doc.id,
    fileName: doc.fileName,
    docType: doc.docType,
  });
  revalidatePath(`/dashboard/patients/${data.patientId}`);
}

export async function deleteMedicalDocumentWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await deleteMedicalDocument(formData);
    return actionSuccess("Document supprimé.");
  } catch (error) {
    return actionError(error);
  }
}
