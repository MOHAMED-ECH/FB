import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { differenceInYears } from "date-fns";
import { ConsultationType, MedicalEntryType } from "@prisma/client";
import { hasPermission, isDoctor, requirePageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import {
  createMedicalNoteEntryWithState,
  deleteMedicalNoteEntryWithState,
  deletePatientVitalWithState,
  updateMedicalNoteEntryWithState,
  updatePatientAdminWithState,
  updatePatientConstantsWithState,
} from "@/actions/patients";
import { createConsultationWithState, updateConsultationWithState } from "@/actions/consultations";
import { deleteMedicalDocumentWithState } from "@/actions/documents";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ConsultationModal } from "@/components/consultation-modal";
import { AutoGrowTextarea } from "@/components/auto-grow-textarea";
import { DocumentUploadForm } from "@/components/document-upload-form";
import { PaymentCollectionForm } from "@/components/payment-collection-form";
import { StatefulActionForm } from "@/components/stateful-action-form";
import { ui } from "@/lib/ui-classes";

type Props = { params: Promise<{ id: string }> };
type MedicalDocRow = { id: string; docType: string; fileName: string; examDate: Date | null };
type MedicalNoteRow = {
  id: string;
  type: MedicalEntryType;
  content: string;
  authorName: string | null;
  updatedByName: string | null;
  recordedAt: Date;
  updatedAt: Date;
};
type VitalRow = {
  id: string;
  bloodPressure: string | null;
  weight: string | null;
  height: string | null;
  pulse: string | null;
  note: string | null;
  recordedAt: Date;
};
type ConsultationRow = {
  id: string;
  date: Date;
  type: ConsultationType;
  notes: string | null;
  doctor: { name: string };
  invoice: {
    id: string;
    expectedAmount: number;
    status: string;
    payments: { amount: number }[];
  } | null;
};

const panelShell =
  "overflow-hidden rounded-lg border border-cabinet-border/90 bg-cabinet-card/95 shadow-[0_16px_45px_-30px_rgba(7,54,36,0.45)]";

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requirePageUser();
  const doctor = isDoctor(user);
  const canAdm = hasPermission(user, "permPatAdm");
  const canMed = hasPermission(user, "permPatMed");
  const canConst = hasPermission(user, "permPatConst");
  const canPay = hasPermission(user, "permPaie");
  const canCollectPayment = !doctor && user.permPaie;

  if (!canAdm && !canMed && !canConst && !canPay) redirect("/dashboard");

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      medical:
        canMed || canConst
          ? {
              include: canMed ? { documents: true, notes: { orderBy: { recordedAt: "asc" } } } : {},
            }
          : false,
      consultations:
        canMed || canPay
          ? {
              orderBy: { date: "desc" },
              include: {
                doctor: { select: { name: true } },
                invoice: { include: { payments: true } },
              },
            }
          : false,
      vitals: canConst || canMed ? { orderBy: { recordedAt: "desc" }, take: 12 } : false,
    },
  });

  if (!patient) notFound();

  const age = differenceInYears(new Date(), patient.birthDate);
  const medicalDocs: MedicalDocRow[] =
    canMed && patient.medical && "documents" in patient.medical
      ? (patient.medical as { documents: MedicalDocRow[] }).documents
      : [];
  const medicalNotes: MedicalNoteRow[] =
    canMed && patient.medical && "notes" in patient.medical
      ? (patient.medical as { notes: MedicalNoteRow[] }).notes
      : [];
  const vitalHistory: VitalRow[] = "vitals" in patient ? (patient.vitals as VitalRow[]) : [];
  const latestVital = vitalHistory[0];
  const consultations: ConsultationRow[] =
    "consultations" in patient ? (patient.consultations as unknown as ConsultationRow[]) : [];
  const pendingAmount = consultations.reduce((sum, consultation) => {
    const expected = consultation.invoice?.expectedAmount ?? 0;
    const paid = consultation.invoice?.payments.reduce((total, payment) => total + payment.amount, 0) ?? 0;
    return sum + Math.max(expected - paid, 0);
  }, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <section className={ui.pageHeader}>
        <Link href="/dashboard/patients" className={ui.link}>
          Retour patients
        </Link>
        <div className="mt-4 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className={ui.eyebrow}>Dossier patient</p>
            <h1 className={ui.pageTitle}>
              {patient.lastName} {patient.firstName}
            </h1>
            <p className={ui.pageSubtitle}>
              {age} ans - {patient.sex} - {patient.phone}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 md:text-right">
            <span className={ui.chip}>{patient.coverageType}</span>
            <span className={ui.chip}>CIN: {patient.cin ?? "-"}</span>
            <span className={ui.chip}>Né(e): {new Intl.DateTimeFormat("fr-FR").format(patient.birthDate)}</span>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {(canMed || canPay) && (
          <CollapsibleSection
            defaultOpen
            eyebrow="Consultations"
            title={doctor ? "Suivi des consultations" : "Consultations à encaisser"}
            description="Historique par date, facture associée et reste à encaisser."
          >
            <div className="space-y-5">
              <div className="flex flex-col gap-4 rounded-md border border-cabinet-border bg-cabinet-cream/45 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniStat label="Consultations" value={String(consultations.length)} />
                  <MiniStat label="À encaisser" value={`${pendingAmount.toFixed(2)} MAD`} />
                  <MiniStat label="Dernière trace" value={consultations[0] ? formatDate(consultations[0].date) : "-"} />
                </div>
                {doctor && (
                  <ConsultationModal>
                    <NewConsultationForm patientId={patient.id} />
                  </ConsultationModal>
                )}
              </div>

              <ConsultationsTimeline
                patientId={patient.id}
                consultations={consultations}
                doctor={doctor}
                canCollectPayment={canCollectPayment}
              />
            </div>
          </CollapsibleSection>
        )}

        {canConst && patient.medical && (
          <CollapsibleSection eyebrow="Suivi clinique" title="Constantes" description="Saisie rapide et historique graphique des constantes.">
            <div className="flex flex-col gap-4 rounded-md border border-cabinet-border bg-cabinet-cream/45 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className={ui.eyebrow}>Dernières valeurs</p>
                <h3 className="mt-1 font-heading text-xl font-semibold text-cabinet-primary-dark">
                  {latestVital ? `Mesure du ${formatDate(latestVital.recordedAt)} à ${formatTime(latestVital.recordedAt)}` : "Aucune mesure enregistrée"}
                </h3>
              </div>
              <ConsultationModal
                triggerLabel="Mettre à jour les constantes"
                eyebrow="Suivi clinique"
                title="Nouvelle mesure des constantes"
                description="Contrôler les valeurs avant enregistrement. Chaque validation crée une ligne datée dans l’historique."
                triggerClassName={ui.btnPrimary}
              >
                <ConstantsUpdateForm
                  patientId={patient.id}
                  bloodPressure={patient.medical.bloodPressure}
                  weight={patient.medical.weight}
                  height={patient.medical.height}
                  pulse={patient.medical.pulse}
                />
              </ConsultationModal>
            </div>
            <VitalsDashboard patientId={patient.id} history={vitalHistory} latest={latestVital} />
          </CollapsibleSection>
        )}

        {canMed && patient.medical && (
          <CollapsibleSection eyebrow="Dossier médical" title="Synthèse neurologique" description="Antécédents et diagnostics suivis par le médecin.">
            <MedicalSummaryPanel
              patientId={patient.id}
              antecedents={patient.medical.antecedents}
              diagnostics={patient.medical.diagnostics}
              updatedAt={patient.medical.updatedAt}
              notes={medicalNotes}
            />
          </CollapsibleSection>
        )}

        {canMed && patient.medical && (
          <CollapsibleSection
            eyebrow="Examens neurologiques"
            title="Documents et imagerie"
            description={`${medicalDocs.length} fichier${medicalDocs.length > 1 ? "s" : ""} joint${medicalDocs.length > 1 ? "s" : ""} au dossier.`}
          >
            <DocumentsPanel patientId={patient.id} medicalDocs={medicalDocs} />
          </CollapsibleSection>
        )}

        {canAdm && (
          <CollapsibleSection eyebrow="Administratif" title="Informations générales" description="Identité, couverture, contact et adresse du patient.">
            <AdminInfoPanel
              patient={{
                id: patient.id,
                lastName: patient.lastName,
                firstName: patient.firstName,
                birthDate: patient.birthDate,
                sex: patient.sex,
                coverageType: patient.coverageType,
                phone: patient.phone,
                cin: patient.cin,
                address: patient.address,
              }}
            />
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

function ConstantsUpdateForm({
  patientId,
  bloodPressure,
  weight,
  height,
  pulse,
}: {
  patientId: string;
  bloodPressure: string | null;
  weight: string | null;
  height: string | null;
  pulse: string | null;
}) {
  return (
    <StatefulActionForm action={updatePatientConstantsWithState.bind(null, patientId)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="TA">
          <input name="bloodPressure" defaultValue={bloodPressure ?? ""} placeholder="Ex. 128/82" className={ui.input} />
        </Field>
        <Field label="Poids">
          <input name="weight" defaultValue={weight ?? ""} placeholder="Ex. 78 kg" className={ui.input} />
        </Field>
        <Field label="Taille">
          <input name="height" defaultValue={height ?? ""} placeholder="Ex. 186 cm" className={ui.input} />
        </Field>
        <Field label="Pouls">
          <input name="pulse" defaultValue={pulse ?? ""} placeholder="Ex. 80" className={ui.input} />
        </Field>
      </div>
      <Field label="Note de mesure">
        <input name="note" placeholder="Ex. mesure avant consultation" className={ui.input} />
      </Field>
      <div className="flex justify-end border-t border-cabinet-border pt-5">
        <button type="submit" className={ui.btnPrimary}>
          Enregistrer la mesure
        </button>
      </div>
    </StatefulActionForm>
  );
}

type AdminPatientSnapshot = {
  id: string;
  lastName: string;
  firstName: string;
  birthDate: Date;
  sex: string;
  coverageType: string;
  phone: string;
  cin: string | null;
  address: string | null;
};

function AdminInfoPanel({ patient }: { patient: AdminPatientSnapshot }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-md border border-cabinet-border bg-cabinet-cream/45 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className={ui.eyebrow}>Fiche administrative</p>
          <h3 className="mt-1 font-heading text-xl font-semibold text-cabinet-primary-dark">
            {patient.lastName} {patient.firstName}
          </h3>
        </div>
        <ConsultationModal
          triggerLabel="Modifier les informations"
          eyebrow="Administratif"
          title="Modifier les informations générales"
          description="Mettre à jour l’identité, la couverture et les coordonnées du patient."
          triggerClassName={ui.btnPrimary}
        >
          <AdminPatientForm patient={patient} />
        </ConsultationModal>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile label="Nom" value={patient.lastName} />
        <InfoTile label="Prénom" value={patient.firstName} />
        <InfoTile label="Naissance" value={new Intl.DateTimeFormat("fr-FR").format(patient.birthDate)} />
        <InfoTile label="Sexe" value={patient.sex} />
        <InfoTile label="Couverture" value={patient.coverageType} />
        <InfoTile label="Téléphone" value={patient.phone} />
        <InfoTile label="CIN" value={patient.cin ?? "-"} />
        <InfoTile label="Adresse" value={patient.address ?? "-"} wide />
      </div>
    </div>
  );
}

function AdminPatientForm({ patient }: { patient: AdminPatientSnapshot }) {
  return (
    <StatefulActionForm action={updatePatientAdminWithState.bind(null, patient.id)} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nom"><input name="lastName" required defaultValue={patient.lastName} className={ui.input} /></Field>
      <Field label="Prénom"><input name="firstName" required defaultValue={patient.firstName} className={ui.input} /></Field>
      <Field label="Naissance"><input type="date" name="birthDate" required defaultValue={patient.birthDate.toISOString().slice(0, 10)} className={ui.input} /></Field>
      <Field label="Sexe">
        <select name="sex" defaultValue={patient.sex} className={ui.select}>
          <option value="M">M</option>
          <option value="F">F</option>
          <option value="Autre">Autre</option>
        </select>
      </Field>
      <Field label="Couverture" wide><input name="coverageType" required defaultValue={patient.coverageType} className={ui.input} /></Field>
      <Field label="Téléphone"><input name="phone" required defaultValue={patient.phone} className={ui.input} /></Field>
      <Field label="CIN"><input name="cin" defaultValue={patient.cin ?? ""} className={ui.input} /></Field>
      <Field label="Adresse" wide><input name="address" defaultValue={patient.address ?? ""} className={ui.input} /></Field>
      <div className="flex justify-end border-t border-cabinet-border pt-5 sm:col-span-2">
        <button type="submit" className={ui.btnPrimary}>Enregistrer les modifications</button>
      </div>
    </StatefulActionForm>
  );
}

function InfoTile({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-md border border-cabinet-border bg-white px-4 py-3 ${wide ? "sm:col-span-2 xl:col-span-2" : ""}`}>
      <p className="text-xs font-semibold uppercase text-cabinet-muted">{label}</p>
      <p className="mt-1 break-words font-semibold text-cabinet-primary-dark">{value}</p>
    </div>
  );
}

function MedicalSummaryPanel({
  patientId,
  antecedents,
  diagnostics,
  updatedAt,
  notes,
}: {
  patientId: string;
  antecedents: string | null;
  diagnostics: string | null;
  updatedAt: Date;
  notes: MedicalNoteRow[];
}) {
  const antecedentEntries = buildMedicalEntries(MedicalEntryType.ANTECEDENT, antecedents, updatedAt, notes);
  const diagnosticEntries = buildMedicalEntries(MedicalEntryType.DIAGNOSTIC, diagnostics, updatedAt, notes);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-md border border-cabinet-border bg-cabinet-cream/45 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className={ui.eyebrow}>Lecture sécurisée</p>
          <h3 className="mt-1 font-heading text-xl font-semibold text-cabinet-primary-dark">Synthèse actuelle</h3>
          <p className="mt-1 text-sm leading-6 text-cabinet-muted">
            Les antécédents et les diagnostics sont suivis séparément. Chaque ajout est daté et toute modification passe par une fenêtre dédiée.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <MiniStat label="Antécédents" value={String(antecedentEntries.length)} />
          <MiniStat label="Diagnostics" value={String(diagnosticEntries.length)} />
        </div>
      </div>

      <div className="space-y-4">
        <MedicalTrackCard
          patientId={patientId}
          type={MedicalEntryType.ANTECEDENT}
          title="Antécédents"
          entries={antecedentEntries}
          emptyText="Aucun antécédent renseigné."
          placeholder="Ex. migraine depuis l’adolescence, HTA traitée, allergie médicamenteuse..."
        />
        <MedicalTrackCard
          patientId={patientId}
          type={MedicalEntryType.DIAGNOSTIC}
          title="Diagnostics / constatations"
          entries={diagnosticEntries}
          emptyText="Aucun diagnostic ou constat clinique renseigné."
          placeholder="Ex. examen neurologique, hypothèses diagnostiques, évolution clinique, conduite à tenir..."
        />
      </div>
    </div>
  );
}

function buildMedicalEntries(
  type: MedicalEntryType,
  summary: string | null,
  updatedAt: Date,
  notes: MedicalNoteRow[]
) {
  const entries = notes.filter((note) => note.type === type);
  if (entries.length > 0) return entries;
  if (!summary) return [];

  return [
    {
      id: `fallback-${type}`,
      type,
      content: summary,
      authorName: "Synthèse initiale",
      updatedByName: null,
      recordedAt: updatedAt,
      updatedAt,
    },
  ];
}

function MedicalTrackCard({
  patientId,
  type,
  title,
  entries,
  emptyText,
  placeholder,
}: {
  patientId: string;
  type: MedicalEntryType;
  title: string;
  entries: MedicalNoteRow[];
  emptyText: string;
  placeholder: string;
}) {
  const modalDescription =
    type === MedicalEntryType.ANTECEDENT
      ? "Ajouter un antécédent daté. La synthèse des antécédents sera recalculée automatiquement."
      : "Ajouter une constatation ou un diagnostic daté. La synthèse diagnostique sera recalculée automatiquement.";

  return (
    <section className="rounded-md border border-cabinet-border bg-cabinet-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={ui.eyebrow}>{title}</p>
          <h3 className="mt-1 font-heading text-xl font-semibold text-cabinet-primary-dark">Synthèse et historique</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <ConsultationModal
            triggerLabel="Ajouter une entrée"
            eyebrow={title}
            title={`Nouvelle entrée - ${title}`}
            description={modalDescription}
            triggerClassName={ui.btnPrimary}
          >
            <MedicalNoteForm
              patientId={patientId}
              type={type}
              placeholder={placeholder}
              submitLabel="Ajouter l’entrée datée"
            />
          </ConsultationModal>
        </div>
      </div>

      <div className="rounded-md border border-cabinet-border bg-white/65 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase text-cabinet-accent-dark">Synthèse actuelle</p>
          <span className={ui.chip}>
            {entries.length} entrée{entries.length > 1 ? "s" : ""}
          </span>
        </div>
        <MedicalIntegratedTimeline entries={entries} emptyText={emptyText} prominent={type === MedicalEntryType.DIAGNOSTIC} />
      </div>

      {entries.some((entry) => !entry.id.startsWith("fallback-")) && (
        <div className="mt-4 flex justify-end border-t border-cabinet-border pt-4">
          <ConsultationModal
            triggerLabel="Modifier ou supprimer une entrée"
            eyebrow={title}
            title={`Gérer les entrées - ${title}`}
            description="Choisir une entrée, puis modifier son contenu ou la supprimer après confirmation."
            triggerClassName={ui.btnSecondary}
          >
            <MedicalEntryManagementPanel patientId={patientId} entries={entries} title={title} placeholder={placeholder} />
          </ConsultationModal>
        </div>
      )}
    </section>
  );
}

function MedicalNoteForm({
  patientId,
  type,
  entry,
  placeholder,
  submitLabel,
}: {
  patientId: string;
  type: MedicalEntryType;
  entry?: MedicalNoteRow;
  placeholder: string;
  submitLabel: string;
}) {
  const action = entry
    ? updateMedicalNoteEntryWithState.bind(null, patientId)
    : createMedicalNoteEntryWithState.bind(null, patientId);

  return (
    <StatefulActionForm action={action} className="space-y-5">
      {!entry && <input type="hidden" name="type" value={type} />}
      {entry && <input type="hidden" name="entryId" value={entry.id} />}
      <Field label="Contenu">
        <AutoGrowTextarea
          name="content"
          rows={8}
          maxHeight={520}
          required
          defaultValue={entry?.content ?? ""}
          placeholder={placeholder}
          className={`${ui.input} min-h-56 resize-none leading-7`}
        />
      </Field>
      <div className="flex justify-end border-t border-cabinet-border pt-5">
        <button type="submit" className={ui.btnPrimary}>
          {submitLabel}
        </button>
      </div>
    </StatefulActionForm>
  );
}

function MedicalIntegratedTimeline({
  entries,
  emptyText,
  prominent,
}: {
  entries: MedicalNoteRow[];
  emptyText: string;
  prominent?: boolean;
}) {
  return (
    <div className={`${prominent ? "max-h-[34rem]" : "max-h-[28rem]"} overflow-y-auto pr-1`}>
      {entries.length === 0 ? (
        <p className="rounded-md border border-dashed border-cabinet-border bg-cabinet-cream/45 px-4 py-5 text-sm text-cabinet-muted">
          {emptyText}
        </p>
      ) : (
        <ol className="space-y-5">
          {entries.map((entry, index) => (
            <MedicalInlineEntry key={entry.id} entry={entry} index={index} />
          ))}
        </ol>
      )}
    </div>
  );
}

function MedicalInlineEntry({ entry, index }: { entry: MedicalNoteRow; index: number }) {
  const editable = !entry.id.startsWith("fallback-");
  const modified = editable && entry.updatedAt.getTime() - entry.recordedAt.getTime() > 1000;
  const railClass = index % 2 === 0 ? "bg-cabinet-primary" : "bg-cabinet-secondary";

  return (
    <li className="grid grid-cols-[10px_1fr] gap-3">
      <div className={`mt-1 min-h-full rounded-full ${railClass}`} aria-hidden />
      <div>
        <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="font-heading text-lg font-semibold text-cabinet-primary-dark">
            {formatDate(entry.recordedAt)}
          </p>
          <p className="text-xs font-semibold uppercase text-cabinet-muted">{formatTime(entry.recordedAt)}</p>
          {entry.authorName && <p className="text-sm text-cabinet-muted">{entry.authorName}</p>}
        </div>
        {modified && (
          <p className="mb-2 text-xs font-semibold text-cabinet-accent-dark">
            Modifiée le {formatDate(entry.updatedAt)} à {formatTime(entry.updatedAt)}
            {entry.updatedByName ? ` par ${entry.updatedByName}` : ""}
          </p>
        )}
        <div className="whitespace-pre-wrap break-words text-sm leading-7 text-cabinet-text">
          {entry.content}
        </div>
      </div>
    </li>
  );
}

function MedicalEntryManagementPanel({
  patientId,
  entries,
  title,
  placeholder,
}: {
  patientId: string;
  entries: MedicalNoteRow[];
  title: string;
  placeholder: string;
}) {
  const editableEntries = entries.filter((entry) => !entry.id.startsWith("fallback-"));

  return (
    <div className="space-y-3">
      {editableEntries.map((entry, index) => (
        <details key={entry.id} className="rounded-md border border-cabinet-border bg-white">
          <summary className="cursor-pointer list-none px-4 py-3 transition hover:bg-cabinet-cream/55 [&::-webkit-details-marker]:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`h-10 w-2 rounded-full ${index % 2 === 0 ? "bg-cabinet-primary" : "bg-cabinet-secondary"}`} />
                <div>
                  <p className="font-heading text-lg font-semibold text-cabinet-primary-dark">
                    {formatDate(entry.recordedAt)} - {formatTime(entry.recordedAt)}
                  </p>
                  <p className="text-sm text-cabinet-muted line-clamp-1">{entry.content}</p>
                </div>
              </div>
              <span className={ui.chip}>Choisir</span>
            </div>
          </summary>
          <div className="space-y-5 border-t border-cabinet-border px-4 py-4">
            <MedicalNoteForm
              patientId={patientId}
              type={entry.type}
              entry={entry}
              placeholder={placeholder}
              submitLabel="Enregistrer la modification"
            />
            <StatefulActionForm action={deleteMedicalNoteEntryWithState.bind(null, patientId)} className="border-t border-cabinet-border pt-4">
              <input type="hidden" name="entryId" value={entry.id} />
              <ConfirmSubmitButton
                message={`Supprimer définitivement cette entrée de ${title.toLowerCase()} ?`}
                confirmTitle="Confirmer la suppression"
                confirmDescription="Cette entrée sera retirée de l’historique et la synthèse sera recalculée. Cette action ne pourra pas être annulée."
                className={ui.btnDanger}
              >
                Supprimer cette entrée
              </ConfirmSubmitButton>
            </StatefulActionForm>
          </div>
        </details>
      ))}
      {editableEntries.length === 0 && (
        <p className="rounded-md border border-dashed border-cabinet-border bg-cabinet-cream/45 px-4 py-5 text-sm text-cabinet-muted">
          Aucune entrée modifiable pour le moment.
        </p>
      )}
    </div>
  );
}
function NewConsultationForm({ patientId }: { patientId: string }) {
  return (
    <StatefulActionForm action={createConsultationWithState} className="space-y-5">
      <input type="hidden" name="patientId" value={patientId} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <Field label="Type">
              <select name="type" className={ui.select}>
                <option value={ConsultationType.FIRST}>Première consultation</option>
                <option value={ConsultationType.CONTROL}>Contrôle</option>
                <option value={ConsultationType.OTHER}>Autre</option>
              </select>
            </Field>
            <div className="rounded-md border border-cabinet-border bg-cabinet-cream/65 px-4 py-3 text-sm leading-6 text-cabinet-muted">
              Vérifier les constantes, documents récents et antécédents avant validation.
            </div>
          </div>
          <Field label="Compte rendu">
            <textarea
              name="notes"
              rows={10}
              placeholder={"Motif de consultation\nExamen neurologique\nHypothèses / diagnostic\nConduite à tenir"}
              className={`${ui.input} min-h-72 resize-y leading-7`}
            />
          </Field>
        </div>

        <aside className="space-y-4">
          <div className="rounded-md border border-cabinet-border bg-cabinet-cream/45 p-4">
            <p className="text-xs font-semibold uppercase text-cabinet-accent-dark">Facture</p>
            <h3 className="mt-1 font-heading text-xl font-semibold text-cabinet-primary-dark">Montant à encaisser</h3>
            <p className="mt-2 text-xs leading-5 text-cabinet-muted">
              Fixé par le médecin. Le secrétariat encaisse après validation.
            </p>
            <div className="mt-4">
              <Field label="Montant facturé (MAD)">
                <input type="number" step="0.01" min="1" name="invoiceAmount" required defaultValue={80} className={ui.input} />
              </Field>
            </div>
          </div>

          <div className="rounded-md border border-cabinet-border bg-cabinet-card p-4">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase text-cabinet-accent-dark">Suite</p>
                <h3 className="mt-1 font-heading text-xl font-semibold text-cabinet-primary-dark">Prochain RDV</h3>
                <p className="mt-2 text-xs leading-5 text-cabinet-muted">Optionnel. Date et motif doivent aller ensemble.</p>
              </div>
              <span className={ui.chip}>Contrôle</span>
            </div>
            <div className="grid gap-3">
              <Field label="Date et heure"><input type="datetime-local" name="nextAppointmentStart" className={ui.input} /></Field>
              <Field label="Durée (minutes)"><input type="number" name="nextDuration" min={5} max={240} defaultValue={30} className={ui.input} /></Field>
              <Field label="Motif du prochain RDV"><input name="nextMotif" placeholder="Ex. contrôle clinique et lecture IRM" className={ui.input} /></Field>
            </div>
          </div>
        </aside>
      </div>
      <div className="flex justify-end border-t border-cabinet-border pt-5">
        <button type="submit" className={ui.btnPrimary}>Terminer et enregistrer la consultation</button>
      </div>
    </StatefulActionForm>
  );
}

function EditConsultationForm({
  patientId,
  consultation,
  invoiceAmount,
}: {
  patientId: string;
  consultation: ConsultationRow;
  invoiceAmount: number;
}) {
  return (
    <StatefulActionForm action={updateConsultationWithState} className="space-y-5">
      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="consultationId" value={consultation.id} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Field label="Type">
            <select name="type" defaultValue={consultation.type} className={ui.select}>
              <option value={ConsultationType.FIRST}>Première consultation</option>
              <option value={ConsultationType.CONTROL}>Contrôle</option>
              <option value={ConsultationType.OTHER}>Autre</option>
            </select>
          </Field>
          <Field label="Compte rendu">
            <textarea
              name="notes"
              rows={12}
              defaultValue={consultation.notes ?? ""}
              className={`${ui.input} min-h-80 resize-y leading-7`}
            />
          </Field>
        </div>

        <aside className="rounded-md border border-cabinet-border bg-cabinet-cream/45 p-4">
          <p className="text-xs font-semibold uppercase text-cabinet-accent-dark">Facture associée</p>
          <h3 className="mt-1 font-heading text-xl font-semibold text-cabinet-primary-dark">Montant de la consultation</h3>
          <p className="mt-2 text-xs leading-5 text-cabinet-muted">
            La correction recalcule automatiquement le statut selon les paiements déjà enregistrés.
          </p>
          <div className="mt-4">
            <Field label="Montant facturé (MAD)">
              <input type="number" step="0.01" min="0.01" name="invoiceAmount" required defaultValue={invoiceAmount.toFixed(2)} className={ui.input} />
            </Field>
          </div>
        </aside>
      </div>
      <div className="flex justify-end border-t border-cabinet-border pt-5">
        <button type="submit" className={ui.btnPrimary}>Enregistrer les modifications</button>
      </div>
    </StatefulActionForm>
  );
}

function ConsultationsTimeline({
  patientId,
  consultations,
  doctor,
  canCollectPayment,
}: {
  patientId: string;
  consultations: ConsultationRow[];
  doctor: boolean;
  canCollectPayment: boolean;
}) {
  if (consultations.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-cabinet-border bg-white/65 px-5 py-10 text-center text-sm text-cabinet-muted">
        Aucune consultation enregistrée pour ce patient.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {consultations.map((consultation) => {
        const paidAmount = consultation.invoice?.payments.reduce((sum, payment) => sum + payment.amount, 0) ?? 0;
        const expectedAmount = consultation.invoice?.expectedAmount ?? 0;
        const remainingAmount = Math.max(expectedAmount - paidAmount, 0);

        return (
          <li key={consultation.id} className="overflow-hidden rounded-lg border border-cabinet-border bg-cabinet-card shadow-[0_14px_42px_-34px_rgba(7,54,36,0.5)]">
            <div className="border-b border-cabinet-border bg-cabinet-cream/55 px-5 py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="min-w-40">
                    <p className="font-heading text-xl font-semibold text-cabinet-primary-dark">{formatDate(consultation.date)}</p>
                    <p className="mt-1 text-sm text-cabinet-muted">{formatTime(consultation.date)}</p>
                  </div>
                  <div>
                    <span className={ui.chip}>{consultation.type}</span>
                    <p className="mt-2 text-xs leading-5 text-cabinet-muted">Validée par {consultation.doctor.name}</p>
                  </div>
                </div>

                {doctor && consultation.invoice && (
                  <ConsultationModal
                    triggerLabel="Modifier la consultation"
                    eyebrow="Correction consultation"
                    title="Modifier la consultation"
                    description="Corriger le type, le compte rendu et le montant facturé associé."
                    triggerClassName={ui.btnSecondary}
                  >
                    <EditConsultationForm
                      patientId={patientId}
                      consultation={consultation}
                      invoiceAmount={expectedAmount}
                    />
                  </ConsultationModal>
                )}
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-md border border-cabinet-border bg-white px-4 py-4">
                <p className="mb-2 text-xs font-semibold uppercase text-cabinet-accent-dark">Compte rendu</p>
                {consultation.notes ? (
                  <p className="whitespace-pre-wrap text-sm leading-7 text-cabinet-text">{consultation.notes}</p>
                ) : (
                  <p className="text-sm text-cabinet-muted">Aucun compte rendu détaillé.</p>
                )}
              </div>

              {consultation.invoice && (
                <div className="rounded-md border border-cabinet-border bg-cabinet-cream/35 p-4">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <FinancePill label="Facture" value={`${expectedAmount.toFixed(2)} MAD`} />
                    <FinancePill label="Paye" value={`${paidAmount.toFixed(2)} MAD`} />
                    <FinancePill label="Reste" value={`${remainingAmount.toFixed(2)} MAD`} tone={remainingAmount > 0 ? "due" : "settled"} />
                    <FinancePill label="Statut" value={invoiceStatusLabel(consultation.invoice.status)} />
                  </div>

                  {canCollectPayment && remainingAmount > 0 && (
                    <PaymentCollectionForm
                      patientId={patientId}
                      consultationId={consultation.id}
                      invoiceId={consultation.invoice.id}
                      remainingAmount={remainingAmount}
                    />
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function FinancePill({ label, value, tone }: { label: string; value: string; tone?: "due" | "settled" }) {
  const toneClass =
    tone === "due"
      ? "border-cabinet-secondary/70 bg-white shadow-[inset_3px_0_0_rgba(190,169,120,0.9)]"
      : tone === "settled"
        ? "border-emerald-200 bg-emerald-50/70"
        : "border-cabinet-border bg-white/80";

  return (
    <div className={`rounded-md border px-3 py-2.5 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase text-cabinet-muted">{label}</p>
      <p className="mt-1 font-heading text-base font-semibold text-cabinet-primary-dark">{value}</p>
    </div>
  );
}

function DocumentsPanel({ patientId, medicalDocs }: { patientId: string; medicalDocs: MedicalDocRow[] }) {
  return (
    <div className="space-y-5">
      <ul className="divide-y divide-cabinet-border rounded-md border border-cabinet-border bg-white/55 px-5 text-sm">
        {medicalDocs.length === 0 ? (
          <li className="my-5 rounded-md border border-dashed border-cabinet-border bg-cabinet-cream/45 px-4 py-5 text-cabinet-muted">
            Aucun document médical n&apos;est encore joint à ce dossier.
          </li>
        ) : (
          medicalDocs.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-cabinet-border bg-cabinet-card text-xs font-bold text-cabinet-primary-dark">
                  {doc.docType.slice(0, 3).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-cabinet-primary-dark">{doc.docType}</p>
                  <p className="truncate text-cabinet-muted">{doc.fileName}</p>
                  {doc.examDate && (
                    <p className="mt-1 text-xs text-cabinet-muted">
                      Examen du {new Intl.DateTimeFormat("fr-FR").format(doc.examDate)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <a href={`/api/files/${doc.id}`} target="_blank" rel="noreferrer" className={ui.btnSecondary}>Ouvrir</a>
                <StatefulActionForm action={deleteMedicalDocumentWithState}>
                  <input type="hidden" name="patientId" value={patientId} />
                  <input type="hidden" name="documentId" value={doc.id} />
                  <ConfirmSubmitButton
                    message={`Supprimer le document ${doc.fileName} ?`}
                    confirmTitle="Confirmer la suppression"
                    confirmDescription="Ce document sera retiré du dossier médical. Cette action ne pourra pas être annulée."
                    className={ui.btnDanger}
                  >
                    Supprimer
                  </ConfirmSubmitButton>
                </StatefulActionForm>
              </div>
            </li>
          ))
        )}
      </ul>

      <DocumentUploadForm patientId={patientId} />
    </div>
  );
}

function CollapsibleSection({
  eyebrow,
  title,
  description,
  defaultOpen = false,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className={`group ${panelShell}`}>
      <summary className="flex cursor-pointer list-none flex-col gap-4 bg-cabinet-card px-6 py-5 transition hover:bg-cabinet-cream/40 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
        <div>
          <p className={ui.eyebrow}>{eyebrow}</p>
          <h2 className="mt-1 font-heading text-2xl font-semibold text-cabinet-primary-dark">{title}</h2>
          {description && <p className="mt-1 max-w-3xl text-sm leading-6 text-cabinet-muted">{description}</p>}
        </div>
        <span className="inline-flex w-fit items-center rounded-md border border-cabinet-border bg-white px-3 py-1.5 text-xs font-semibold uppercase text-cabinet-primary-dark shadow-sm">
          <span className="group-open:hidden">Ouvrir</span>
          <span className="hidden group-open:inline">Fermer</span>
        </span>
      </summary>
      <div className="border-t border-cabinet-border bg-white/45 px-6 py-5">{children}</div>
    </details>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-cabinet-border bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase text-cabinet-muted">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold text-cabinet-primary-dark">{value}</p>
    </div>
  );
}

function VitalsDashboard({ patientId, history, latest }: { patientId: string; history: VitalRow[]; latest?: VitalRow }) {
  const chronological = [...history].reverse();
  const weightSeries = buildSeries(chronological, "weight");
  const pulseSeries = buildSeries(chronological, "pulse");
  const systolicSeries = buildBloodPressureSeries(chronological, 0);
  const diastolicSeries = buildBloodPressureSeries(chronological, 1);

  return (
    <div className="mt-6 border-t border-cabinet-border pt-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={ui.eyebrow}>Historique</p>
          <h3 className={ui.sectionTitle}>Suivi des constantes</h3>
        </div>
        {latest && (
          <span className={ui.chip}>
            Dernière mesure : {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(latest.recordedAt)}
          </span>
        )}
      </div>

      {latest ? (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <VitalCard label="TA" value={latest.bloodPressure} trend={trendText(systolicSeries)} />
            <VitalCard label="Poids" value={latest.weight} trend={trendText(weightSeries)} />
            <VitalCard label="Taille" value={latest.height} />
            <VitalCard label="Pouls" value={latest.pulse} trend={trendText(pulseSeries)} />
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <VitalChart title="Poids" unit="kg" points={weightSeries} />
            <VitalChart title="Pouls" unit="bpm" points={pulseSeries} />
            <VitalChart title="Tension systolique" unit="mmHg" points={systolicSeries} />
            <VitalChart title="Tension diastolique" unit="mmHg" points={diastolicSeries} />
          </div>

          <ul className="mt-5 space-y-2">
            {history.map((vital) => (
              <li key={vital.id} className="rounded-md border border-cabinet-border bg-cabinet-cream/45 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-cabinet-primary-dark">
                    {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(vital.recordedAt)}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold uppercase text-cabinet-muted">
                      TA {vital.bloodPressure ?? "-"} - Poids {vital.weight ?? "-"} - Taille {vital.height ?? "-"} - Pouls {vital.pulse ?? "-"}
                    </span>
                    <StatefulActionForm action={deletePatientVitalWithState}>
                      <input type="hidden" name="patientId" value={patientId} />
                      <input type="hidden" name="vitalId" value={vital.id} />
                      <ConfirmSubmitButton
                        message="Confirmer la suppression de cette ligne de constantes ?"
                        className={ui.btnDanger}
                      >
                        Supprimer
                      </ConfirmSubmitButton>
                    </StatefulActionForm>
                  </div>
                </div>
                {vital.note && <p className="mt-2 text-cabinet-muted">{vital.note}</p>}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="rounded-md border border-dashed border-cabinet-border bg-cabinet-cream/45 px-4 py-5 text-sm text-cabinet-muted">
          Aucun historique de constantes pour le moment. La prochaine mise à jour créera la première mesure.
        </p>
      )}
    </div>
  );
}

function VitalCard({ label, value, trend }: { label: string; value: string | null; trend?: string }) {
  return (
    <div className="rounded-md border border-cabinet-border bg-cabinet-card px-3 py-3">
      <p className="text-xs font-semibold uppercase text-cabinet-muted">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold text-cabinet-primary-dark">{value ?? "-"}</p>
      {trend && <p className="mt-1 text-xs font-semibold text-cabinet-muted">{trend}</p>}
    </div>
  );
}

function invoiceStatusLabel(status: string) {
  if (status === "PAID") return "Payée";
  if (status === "PARTIAL") return "Partiel";
  return "Non payée";
}

function VitalChart({ title, unit, points }: { title: string; unit: string; points: number[] }) {
  const last = points.at(-1);

  return (
    <div className="rounded-md border border-cabinet-border bg-cabinet-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-cabinet-muted">{title}</p>
          <p className="font-heading text-lg font-semibold text-cabinet-primary-dark">
            {last === undefined ? "-" : `${formatNumber(last)} ${unit}`}
          </p>
        </div>
        <span className={ui.chip}>{points.length} mesure{points.length > 1 ? "s" : ""}</span>
      </div>
      <Sparkline points={points} />
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) {
    return (
      <div className="flex h-28 items-center justify-center rounded-md border border-dashed border-cabinet-border bg-cabinet-cream/35 text-xs font-semibold uppercase text-cabinet-muted">
        Pas assez de données
      </div>
    );
  }

  const width = 320;
  const height = 112;
  const padding = 12;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = (width - padding * 2) / (points.length - 1);
  const coordinates = points.map((point, index) => {
    const x = padding + index * step;
    const y = height - padding - ((point - min) / range) * (height - padding * 2);
    return { x, y };
  });
  const path = coordinates.map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.y}`).join(" ");
  const area = `${path} L ${coordinates.at(-1)?.x ?? padding} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full rounded-md bg-cabinet-cream/30" role="img" aria-label="Courbe des constantes">
      <path d={area} fill="rgba(37, 96, 69, 0.10)" />
      <path d={path} fill="none" stroke="rgb(37, 96, 69)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {coordinates.map((coord) => (
        <circle key={`${coord.x}-${coord.y}`} cx={coord.x} cy={coord.y} r="3.5" fill="rgb(190, 169, 120)" stroke="white" strokeWidth="2" />
      ))}
      <text x={padding} y={height - 4} className="fill-cabinet-muted text-[10px]">
        {formatNumber(min)}
      </text>
      <text x={width - padding} y={14} textAnchor="end" className="fill-cabinet-muted text-[10px]">
        {formatNumber(max)}
      </text>
    </svg>
  );
}

function buildSeries(history: VitalRow[], key: "weight" | "pulse") {
  return history.map((item) => parseNumber(item[key])).filter((value): value is number => value !== null);
}

function buildBloodPressureSeries(history: VitalRow[], index: 0 | 1) {
  return history
    .map((item) => {
      const parts = item.bloodPressure?.match(/\d+(?:[.,]\d+)?/g);
      if (!parts?.[index]) return null;
      return parseNumber(parts[index]);
    })
    .filter((value): value is number => value !== null);
}

function parseNumber(value: string | null | undefined) {
  if (!value) return null;
  const match = value.replace(",", ".").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function trendText(points: number[]) {
  if (points.length < 2) return undefined;
  const delta = points[points.length - 1] - points[0];
  if (Math.abs(delta) < 0.1) return "Stable";
  return `${delta > 0 ? "+" : ""}${formatNumber(delta)} depuis le début`;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(value);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(value);
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="mb-1.5 block text-xs font-semibold uppercase text-cabinet-primary-dark">{label}</span>
      {children}
    </label>
  );
}
