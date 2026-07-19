"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MedicalEntryType, type Prisma } from "@prisma/client";
import { z } from "zod";
import { hasPermission, requirePermission, requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { actionError, actionSuccess, type ActionState } from "@/lib/action-state";
import { dateFromForm, formValue, longText, nonEmptyText, optionalString } from "@/lib/forms";

const adminPatientSchema = z.object({
  lastName: nonEmptyText.max(80),
  firstName: nonEmptyText.max(80),
  birthDate: dateFromForm,
  sex: z.enum(["M", "F", "Autre"]),
  coverageType: nonEmptyText.max(120),
  phone: nonEmptyText.max(30),
  cin: optionalString,
  address: optionalString,
});

const medicalNoteContent = z.string().trim().min(1, "Le contenu médical est obligatoire").max(12000);

const medicalNoteTypeSchema = z.enum([MedicalEntryType.ANTECEDENT, MedicalEntryType.DIAGNOSTIC]);

type MedicalSummarySnapshot = {
  id: string;
  antecedents: string | null;
  diagnostics: string | null;
  updatedAt: Date;
};

function readAdminPatient(formData: FormData) {
  return adminPatientSchema.parse({
    lastName: formValue(formData, "lastName"),
    firstName: formValue(formData, "firstName"),
    birthDate: formValue(formData, "birthDate"),
    sex: formValue(formData, "sex") || "M",
    coverageType: formValue(formData, "coverageType"),
    phone: formValue(formData, "phone"),
    cin: formValue(formData, "cin"),
    address: formValue(formData, "address"),
  });
}

function medicalSummaryField(type: MedicalEntryType) {
  return type === MedicalEntryType.ANTECEDENT ? "antecedents" : "diagnostics";
}

function medicalEntryLabel(type: MedicalEntryType) {
  return type === MedicalEntryType.ANTECEDENT ? "Antécédents" : "Diagnostics / constatations";
}

async function getOrCreateMedical(tx: Prisma.TransactionClient, patientId: string): Promise<MedicalSummarySnapshot> {
  const existing = await tx.patientMedical.findUnique({
    where: { patientId },
    select: { id: true, antecedents: true, diagnostics: true, updatedAt: true },
  });
  if (existing) return existing;

  const patient = await tx.patient.findUnique({ where: { id: patientId }, select: { id: true } });
  if (!patient) throw new Error("Patient introuvable");

  return tx.patientMedical.create({
    data: { patientId },
    select: { id: true, antecedents: true, diagnostics: true, updatedAt: true },
  });
}

async function ensureInitialMedicalNote(
  tx: Prisma.TransactionClient,
  medical: MedicalSummarySnapshot,
  type: MedicalEntryType
) {
  const existingCount = await tx.medicalNoteEntry.count({
    where: { medicalId: medical.id, type },
  });
  if (existingCount > 0) return;

  const field = medicalSummaryField(type);
  const content = medical[field]?.trim();
  if (!content) return;

  await tx.medicalNoteEntry.create({
    data: {
      medicalId: medical.id,
      type,
      content,
      authorName: "Synthèse initiale",
      recordedAt: medical.updatedAt,
    },
  });
}

async function rebuildMedicalSummary(tx: Prisma.TransactionClient, medicalId: string, type: MedicalEntryType) {
  const notes = await tx.medicalNoteEntry.findMany({
    where: { medicalId, type },
    orderBy: [{ recordedAt: "asc" }, { updatedAt: "asc" }],
    select: { content: true },
  });
  const content = notes.map((note) => note.content.trim()).filter(Boolean).join("\n\n") || null;
  const field = medicalSummaryField(type);
  const data: Prisma.PatientMedicalUpdateInput =
    field === "antecedents" ? { antecedents: content } : { diagnostics: content };

  await tx.patientMedical.update({
    where: { id: medicalId },
    data,
  });
}

export async function createPatient(formData: FormData) {
  const user = await requirePermission("permPatAdm");
  const data = readAdminPatient(formData);

  const patient = await prisma.patient.create({
    data: {
      ...data,
      medical: { create: {} },
    },
  });

  await logAudit(user.id, "CREATE", "Patient", { patientId: patient.id });
  revalidatePath("/dashboard/patients");
  redirect(`/dashboard/patients/${patient.id}`);
}

export async function createPatientWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await createPatient(formData);
    return actionSuccess("Patient créé.");
  } catch (error) {
    return actionError(error);
  }
}

export async function updatePatientAdmin(patientId: string, formData: FormData) {
  const user = await requirePermission("permPatAdm");
  const data = readAdminPatient(formData);

  await prisma.patient.update({
    where: { id: patientId },
    data,
  });

  await logAudit(user.id, "UPDATE_ADMIN", "Patient", { patientId });
  revalidatePath("/dashboard/patients");
  revalidatePath(`/dashboard/patients/${patientId}`);
}

export async function updatePatientAdminWithState(
  patientId: string,
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await updatePatientAdmin(patientId, formData);
    return actionSuccess("Informations générales mises à jour.");
  } catch (error) {
    return actionError(error);
  }
}

export async function updatePatientMedical(patientId: string, formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "permPatMed")) throw new Error("Permission refusée");

  const antecedents = longText.parse(formValue(formData, "antecedents")) || null;
  const diagnostics = longText.parse(formValue(formData, "diagnostics")) || null;

  await prisma.patientMedical.upsert({
    where: { patientId },
    create: {
      patientId,
      antecedents,
      diagnostics,
    },
    update: { antecedents, diagnostics },
  });

  await logAudit(user.id, "UPDATE_MEDICAL", "PatientMedical", { patientId });
  revalidatePath(`/dashboard/patients/${patientId}`);
}

export async function createMedicalNoteEntry(patientId: string, formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "permPatMed")) throw new Error("Permission refusée");

  const data = z
    .object({
      type: medicalNoteTypeSchema,
      content: medicalNoteContent,
    })
    .parse({
      type: formValue(formData, "type"),
      content: formValue(formData, "content"),
    });

  await prisma.$transaction(async (tx) => {
    const medical = await getOrCreateMedical(tx, patientId);
    await ensureInitialMedicalNote(tx, medical, data.type);
    await tx.medicalNoteEntry.create({
      data: {
        medicalId: medical.id,
        type: data.type,
        content: data.content,
        authorId: user.id,
        authorName: user.name,
      },
    });
    await rebuildMedicalSummary(tx, medical.id, data.type);
  });

  await logAudit(user.id, "CREATE_MEDICAL_NOTE", "MedicalNoteEntry", {
    patientId,
    type: data.type,
    label: medicalEntryLabel(data.type),
  });
  revalidatePath(`/dashboard/patients/${patientId}`);
}

export async function createMedicalNoteEntryWithState(
  patientId: string,
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await createMedicalNoteEntry(patientId, formData);
    return actionSuccess("Entrée médicale ajoutée.");
  } catch (error) {
    return actionError(error);
  }
}

export async function updateMedicalNoteEntry(patientId: string, formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "permPatMed")) throw new Error("Permission refusée");

  const data = z
    .object({
      entryId: nonEmptyText,
      content: medicalNoteContent,
    })
    .parse({
      entryId: formValue(formData, "entryId"),
      content: formValue(formData, "content"),
    });

  let noteType: MedicalEntryType | null = null;

  await prisma.$transaction(async (tx) => {
    const note = await tx.medicalNoteEntry.findFirst({
      where: {
        id: data.entryId,
        medical: { patientId },
      },
      select: { id: true, medicalId: true, type: true },
    });
    if (!note) throw new Error("Entrée médicale introuvable pour ce patient.");

    await tx.medicalNoteEntry.update({
      where: { id: note.id },
      data: {
        content: data.content,
        updatedById: user.id,
        updatedByName: user.name,
      },
    });
    await rebuildMedicalSummary(tx, note.medicalId, note.type);
    noteType = note.type;
  });

  await logAudit(user.id, "UPDATE_MEDICAL_NOTE", "MedicalNoteEntry", {
    patientId,
    entryId: data.entryId,
    type: noteType,
  });
  revalidatePath(`/dashboard/patients/${patientId}`);
}

export async function updateMedicalNoteEntryWithState(
  patientId: string,
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await updateMedicalNoteEntry(patientId, formData);
    return actionSuccess("Entrée médicale mise à jour.");
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteMedicalNoteEntry(patientId: string, formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "permPatMed")) throw new Error("Permission refusée");

  const data = z
    .object({
      entryId: nonEmptyText,
    })
    .parse({
      entryId: formValue(formData, "entryId"),
    });

  let noteType: MedicalEntryType | null = null;

  await prisma.$transaction(async (tx) => {
    const note = await tx.medicalNoteEntry.findFirst({
      where: {
        id: data.entryId,
        medical: { patientId },
      },
      select: { id: true, medicalId: true, type: true },
    });
    if (!note) throw new Error("Entrée médicale introuvable pour ce patient.");

    await tx.medicalNoteEntry.delete({
      where: { id: note.id },
    });
    await rebuildMedicalSummary(tx, note.medicalId, note.type);
    noteType = note.type;
  });

  await logAudit(user.id, "DELETE_MEDICAL_NOTE", "MedicalNoteEntry", {
    patientId,
    entryId: data.entryId,
    type: noteType,
  });
  revalidatePath(`/dashboard/patients/${patientId}`);
}

export async function deleteMedicalNoteEntryWithState(
  patientId: string,
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await deleteMedicalNoteEntry(patientId, formData);
    return actionSuccess("Entrée médicale supprimée.");
  } catch (error) {
    return actionError(error);
  }
}

export async function updatePatientConstants(patientId: string, formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "permPatConst")) throw new Error("Permission refusée");

  const constants = z
    .object({
      bloodPressure: optionalString,
      weight: optionalString,
      height: optionalString,
      pulse: optionalString,
      note: optionalString,
    })
    .parse({
      bloodPressure: formValue(formData, "bloodPressure"),
      weight: formValue(formData, "weight"),
      height: formValue(formData, "height"),
      pulse: formValue(formData, "pulse"),
      note: formValue(formData, "note"),
    });

  const { note, ...latestConstants } = constants;
  const hasAtLeastOneValue = Object.values(latestConstants).some(Boolean);
  if (!hasAtLeastOneValue) throw new Error("Au moins une constante doit être renseignée");

  await prisma.$transaction(async (tx) => {
    const patient = await tx.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });
    if (!patient) throw new Error("Patient introuvable");

    await tx.patientMedical.upsert({
      where: { patientId },
      create: {
        patientId,
        ...latestConstants,
      },
      update: latestConstants,
    });

    await tx.patientVital.create({
      data: {
        patientId,
        recordedById: user.id,
        ...latestConstants,
        note,
      },
    });
  });

  await logAudit(user.id, "UPDATE_CONSTANTS", "PatientMedical", { patientId });
  revalidatePath(`/dashboard/patients/${patientId}`);
}

export async function updatePatientConstantsWithState(
  patientId: string,
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await updatePatientConstants(patientId, formData);
    return actionSuccess("Constantes mises à jour.");
  } catch (error) {
    return actionError(error);
  }
}

export async function deletePatientVital(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "permPatConst")) throw new Error("Permission refusée");

  const data = z
    .object({
      patientId: nonEmptyText,
      vitalId: nonEmptyText,
    })
    .parse({
      patientId: formValue(formData, "patientId"),
      vitalId: formValue(formData, "vitalId"),
    });

  await prisma.$transaction(async (tx) => {
    const vital = await tx.patientVital.findFirst({
      where: {
        id: data.vitalId,
        patientId: data.patientId,
      },
      select: { id: true },
    });
    if (!vital) throw new Error("Mesure introuvable pour ce patient.");

    await tx.patientVital.delete({
      where: { id: vital.id },
    });

    const latest = await tx.patientVital.findFirst({
      where: { patientId: data.patientId },
      orderBy: { recordedAt: "desc" },
      select: {
        bloodPressure: true,
        weight: true,
        height: true,
        pulse: true,
      },
    });

    await tx.patientMedical.upsert({
      where: { patientId: data.patientId },
      create: {
        patientId: data.patientId,
        bloodPressure: latest?.bloodPressure ?? null,
        weight: latest?.weight ?? null,
        height: latest?.height ?? null,
        pulse: latest?.pulse ?? null,
      },
      update: {
        bloodPressure: latest?.bloodPressure ?? null,
        weight: latest?.weight ?? null,
        height: latest?.height ?? null,
        pulse: latest?.pulse ?? null,
      },
    });
  });

  await logAudit(user.id, "DELETE_VITAL", "PatientVital", data);
  revalidatePath(`/dashboard/patients/${data.patientId}`);
}

export async function deletePatientVitalWithState(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await deletePatientVital(formData);
    return actionSuccess("Mesure supprimée.");
  } catch (error) {
    return actionError(error);
  }
}
