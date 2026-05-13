"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

function isDoctor(role: string) {
  return role === "DOCTOR";
}

export async function createPatient(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permPatAdm) throw new Error("Permission refusée");

  const lastName = String(formData.get("lastName") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const birthDate = new Date(String(formData.get("birthDate")));
  const sex = String(formData.get("sex") ?? "M");
  const coverageType = String(formData.get("coverageType") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const cin = String(formData.get("cin") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;

  if (!lastName || !firstName || Number.isNaN(birthDate.getTime())) {
    throw new Error("Champs obligatoires manquants");
  }

  const p = await prisma.patient.create({
    data: {
      lastName,
      firstName,
      birthDate,
      sex,
      coverageType,
      phone,
      cin,
      address,
      medical: { create: {} },
    },
  });

  await logAudit(session.user.id, "CREATE", "Patient", { patientId: p.id });
  revalidatePath("/dashboard/patients");
  redirect(`/dashboard/patients/${p.id}`);
}

export async function updatePatientAdmin(patientId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permPatAdm) throw new Error("Permission refusée");

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      lastName: String(formData.get("lastName") ?? "").trim(),
      firstName: String(formData.get("firstName") ?? "").trim(),
      birthDate: new Date(String(formData.get("birthDate"))),
      sex: String(formData.get("sex") ?? "M"),
      coverageType: String(formData.get("coverageType") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      cin: String(formData.get("cin") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
    },
  });

  await logAudit(session.user.id, "UPDATE_ADMIN", "Patient", { patientId });
  revalidatePath("/dashboard/patients");
  revalidatePath(`/dashboard/patients/${patientId}`);
}

export async function updatePatientMedical(patientId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  const u = session?.user;
  if (!u) throw new Error("Non authentifié");
  if (!isDoctor(u.role) && !u.permPatMed) throw new Error("Permission refusée");

  const antecedents = String(formData.get("antecedents") ?? "");
  const diagnostics = String(formData.get("diagnostics") ?? "");

  await prisma.patientMedical.upsert({
    where: { patientId },
    create: {
      patientId,
      antecedents,
      diagnostics,
    },
    update: { antecedents, diagnostics },
  });

  await logAudit(session.user.id, "UPDATE_MEDICAL", "PatientMedical", { patientId });
  revalidatePath(`/dashboard/patients/${patientId}`);
}

export async function updatePatientConstants(patientId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  const u = session?.user;
  if (!u) throw new Error("Non authentifié");
  if (!isDoctor(u.role) && !u.permPatConst) throw new Error("Permission refusée");

  await prisma.patientMedical.upsert({
    where: { patientId },
    create: {
      patientId,
      bloodPressure: String(formData.get("bloodPressure") ?? "") || null,
      weight: String(formData.get("weight") ?? "") || null,
      height: String(formData.get("height") ?? "") || null,
      pulse: String(formData.get("pulse") ?? "") || null,
    },
    update: {
      bloodPressure: String(formData.get("bloodPressure") ?? "") || null,
      weight: String(formData.get("weight") ?? "") || null,
      height: String(formData.get("height") ?? "") || null,
      pulse: String(formData.get("pulse") ?? "") || null,
    },
  });

  await logAudit(session.user.id, "UPDATE_CONSTANTS", "PatientMedical", { patientId });
  revalidatePath(`/dashboard/patients/${patientId}`);
}
