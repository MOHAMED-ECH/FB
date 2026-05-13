import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { differenceInYears } from "date-fns";
import { getServerSession } from "next-auth";
import { ConsultationType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  updatePatientAdmin,
  updatePatientConstants,
  updatePatientMedical,
} from "@/actions/patients";
import { createConsultation } from "@/actions/consultations";
import { createPayment } from "@/actions/payments";
import { uploadMedicalDocument } from "@/actions/documents";
import { ui } from "@/lib/ui-classes";

type Props = { params: Promise<{ id: string }> };

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const u = session.user;
  const isDoctor = u.role === "DOCTOR";
  const canAdm = u.permPatAdm;
  const canMed = isDoctor || u.permPatMed;
  const canConst = isDoctor || u.permPatConst;
  const canPay = u.permPaie;

  if (!canAdm && !canMed) redirect("/dashboard");

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      medical:
        canMed || canConst
          ? {
              include: canMed ? { documents: true } : {},
            }
          : false,
      consultations: canMed
        ? { orderBy: { date: "desc" }, include: { doctor: { select: { name: true } } } }
        : false,
    },
  });

  if (!patient) notFound();

  const age = differenceInYears(new Date(), patient.birthDate);

  type MedicalDocRow = { id: string; docType: string; fileName: string; examDate: Date | null };
  const medicalDocs: MedicalDocRow[] =
    canMed && patient.medical && "documents" in patient.medical
      ? (patient.medical as { documents: MedicalDocRow[] }).documents
      : [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <div>
        <Link href="/dashboard/patients" className={ui.link}>
          ← Patients
        </Link>
        <h1 className={`${ui.pageTitle} mt-2`}>
          {patient.lastName} {patient.firstName}
        </h1>
        <p className={ui.pageSubtitle}>
          {age} ans · {patient.sex} · {patient.phone}
        </p>
      </div>

      {canAdm && (
        <section className={ui.card}>
          <h2 className="mb-4 text-lg font-medium text-cabinet-primary">Informations générales</h2>
          <form action={updatePatientAdmin.bind(null, patient.id)} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium">Nom</label>
              <input
                name="lastName"
                defaultValue={patient.lastName}
                className={ui.input}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Prénom</label>
              <input
                name="firstName"
                defaultValue={patient.firstName}
                className={ui.input}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Naissance</label>
              <input
                type="date"
                name="birthDate"
                defaultValue={patient.birthDate.toISOString().slice(0, 10)}
                className={ui.input}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Sexe</label>
              <select
                name="sex"
                defaultValue={patient.sex}
                className={ui.input}
              >
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium">Couverture</label>
              <input
                name="coverageType"
                defaultValue={patient.coverageType}
                className={ui.input}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Téléphone</label>
              <input
                name="phone"
                defaultValue={patient.phone}
                className={ui.input}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">CIN</label>
              <input
                name="cin"
                defaultValue={patient.cin ?? ""}
                className={ui.input}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium">Adresse</label>
              <input
                name="address"
                defaultValue={patient.address ?? ""}
                className={ui.input}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-lg bg-cabinet-primary px-4 py-2 text-sm text-white hover:bg-cabinet-primary/90">
                Enregistrer
              </button>
            </div>
          </form>
        </section>
      )}

      {canConst && patient.medical && (
        <section className={ui.card}>
          <h2 className="mb-4 text-lg font-medium text-cabinet-primary">Constantes</h2>
          <form action={updatePatientConstants.bind(null, patient.id)} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs">TA</label>
              <input
                name="bloodPressure"
                defaultValue={patient.medical.bloodPressure ?? ""}
                className={ui.input}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs">Poids</label>
              <input
                name="weight"
                defaultValue={patient.medical.weight ?? ""}
                className={ui.input}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs">Taille</label>
              <input
                name="height"
                defaultValue={patient.medical.height ?? ""}
                className={ui.input}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs">Pouls</label>
              <input
                name="pulse"
                defaultValue={patient.medical.pulse ?? ""}
                className={ui.input}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded bg-cabinet-secondary/40 px-3 py-1.5 text-sm text-cabinet-primary">
                Mettre à jour les constantes
              </button>
            </div>
          </form>
        </section>
      )}

      {canMed && patient.medical && (
        <>
          <section className={ui.card}>
            <h2 className="mb-4 text-lg font-medium text-cabinet-primary">Dossier médical</h2>
            <form action={updatePatientMedical.bind(null, patient.id)} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs">Antécédents</label>
                <textarea
                  name="antecedents"
                  rows={4}
                  defaultValue={patient.medical.antecedents ?? ""}
                  className={ui.input}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs">Diagnostics / constatations</label>
                <textarea
                  name="diagnostics"
                  rows={4}
                  defaultValue={patient.medical.diagnostics ?? ""}
                  className={ui.input}
                />
              </div>
              <button type="submit" className="rounded bg-cabinet-primary px-4 py-2 text-sm text-white">
                Enregistrer le dossier médical
              </button>
            </form>
          </section>

          <section className={ui.card}>
            <h3 className="mb-3 font-medium text-cabinet-primary">Documents (IRM, EEG, etc.)</h3>
            <ul className="mb-4 space-y-2 text-sm">
              {medicalDocs.length === 0 ? (
                <li className="text-cabinet-text/70">Aucun document.</li>
              ) : (
                medicalDocs.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-cabinet-secondary/15 py-2">
                    <span>
                      {d.docType} — {d.fileName}
                      {d.examDate && (
                        <span className="text-cabinet-text/65">
                          {" "}
                          ({new Intl.DateTimeFormat("fr-FR").format(d.examDate)})
                        </span>
                      )}
                    </span>
                    <a
                      href={`/api/files/${d.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cabinet-primary underline"
                    >
                      Ouvrir
                    </a>
                  </li>
                ))
              )}
            </ul>
            <form action={uploadMedicalDocument} className="grid gap-3 border-t border-cabinet-secondary/20 pt-4">
              <input type="hidden" name="patientId" value={patient.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs">Type</label>
                  <select name="docType" className={ui.input}>
                    <option>IRM</option>
                    <option>Scanner</option>
                    <option>EEG</option>
                    <option>ENMG</option>
                    <option>PEV</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs">Date examen</label>
                  <input type="date" name="examDate" className={ui.input} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs">Titre (optionnel)</label>
                <input name="title" className={ui.input} />
              </div>
              <div>
                <label className="mb-1 block text-xs">Fichier</label>
                <input type="file" name="file" required className="text-sm" />
              </div>
              <button type="submit" className="w-fit rounded bg-cabinet-primary px-3 py-2 text-sm text-white">
                Téléverser
              </button>
            </form>
          </section>

          <section className={ui.card}>
            <h3 className="mb-3 font-medium text-cabinet-primary">Nouvelle consultation</h3>
            {isDoctor ? (
              <form action={createConsultation} className="space-y-3">
                <input type="hidden" name="patientId" value={patient.id} />
                <div>
                  <label className="mb-1 block text-xs">Type</label>
                  <select name="type" className={ui.input}>
                    <option value={ConsultationType.FIRST}>Première consultation</option>
                    <option value={ConsultationType.CONTROL}>Contrôle</option>
                    <option value={ConsultationType.OTHER}>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs">Compte rendu / notes</label>
                  <textarea name="notes" rows={4} className={ui.input} />
                </div>
                <p className="text-xs font-medium text-cabinet-primary">Programmer le prochain RDV (optionnel)</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs">Date/heure</label>
                    <input type="datetime-local" name="nextAppointmentStart" className={ui.input} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs">Durée (min)</label>
                    <input type="number" name="nextDuration" defaultValue={30} className={ui.input} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs">Motif du prochain RDV</label>
                  <input name="nextMotif" className={ui.input} />
                </div>
                <button type="submit" className="rounded bg-cabinet-primary px-4 py-2 text-sm text-white">
                  Enregistrer la consultation
                </button>
              </form>
            ) : (
              <p className="text-sm text-cabinet-text/75">Seul le médecin peut valider une consultation.</p>
            )}
            {patient.consultations && patient.consultations.length > 0 && (
              <ul className="mt-6 space-y-3 border-t border-cabinet-secondary/20 pt-4 text-sm">
                {patient.consultations.map((c) => {
                  const row = c as typeof c & { doctor: { name: string } };
                  return (
                  <li key={c.id} className="rounded border border-cabinet-secondary/20 bg-cabinet-bg/40 p-3">
                    <p className="font-medium text-cabinet-primary">
                      {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(c.date)} —{" "}
                      {c.type}
                    </p>
                    <p className="text-xs text-cabinet-text/65">Par {row.doctor.name}</p>
                    {c.notes && <p className="mt-2 whitespace-pre-wrap text-cabinet-text">{c.notes}</p>}
                  </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      {canPay && (
        <section className={ui.card}>
          <h2 className="mb-4 text-lg font-medium text-cabinet-primary">Encaissement</h2>
          <form action={createPayment} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="patientId" value={patient.id} />
            <div>
              <label className="mb-1 block text-xs">Montant (€)</label>
              <input type="number" step="0.01" name="amount" required className={ui.input} />
            </div>
            <div>
              <label className="mb-1 block text-xs">Mode</label>
              <select name="method" className={ui.input}>
                <option value="CASH">Espèces</option>
                <option value="CARD">Carte</option>
                <option value="CHEQUE">Chèque</option>
                <option value="TRANSFER">Virement</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs">Note</label>
              <input name="note" className={ui.input} />
            </div>
            <button type="submit" className="sm:col-span-2 rounded bg-cabinet-primary px-4 py-2 text-sm text-white">
              Enregistrer le paiement
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
