import { endOfDay, startOfDay } from "date-fns";
import { redirect } from "next/navigation";
import { WaitingStatus } from "@prisma/client";
import { AutoRefresh } from "@/components/auto-refresh";
import { AddToWaitingForm, WaitingStatusForm } from "@/components/waiting-actions";
import { hasPermission, requirePageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/ui-classes";

export default async function WaitingPage() {
  const user = await requirePageUser();
  if (!hasPermission(user, "permFile")) redirect("/dashboard");

  const day = new Date();
  const entries = await prisma.waitingEntry.findMany({
    where: { day: { gte: startOfDay(day), lte: endOfDay(day) } },
    include: { patient: true },
    orderBy: { arrivedAt: "asc" },
  });

  const patients = await prisma.patient.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const active = entries.filter((entry) => entry.status !== WaitingStatus.DONE);
  const waiting = entries.filter((entry) => entry.status === WaitingStatus.WAITING);
  const inProgress = entries.filter((entry) => entry.status === WaitingStatus.IN_PROGRESS);
  const done = entries.filter((entry) => entry.status === WaitingStatus.DONE);
  const nextPatient = waiting[0];

  const patientOptions = patients.map(({ id, lastName, firstName, phone, cin }) => ({
    id,
    lastName,
    firstName,
    phone,
    cin,
  }));

  return (
    <div className={ui.pageWrap}>
      <AutoRefresh />
      <section className={ui.pageHeader}>
        <div className={ui.pageHeaderInner}>
          <div>
            <p className={ui.eyebrow}>Accueil patient</p>
            <h1 className={ui.pageTitle}>Salle d’attente</h1>
            <p className={ui.pageSubtitle}>Ordre d’arrivée, prise en charge et fin de passage pour aujourd’hui.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <span className={ui.chip}>{waiting.length} attente</span>
            <span className={ui.chip}>{inProgress.length} en cours</span>
            <span className={ui.chip}>{done.length} traités</span>
          </div>
        </div>
      </section>

      {nextPatient && (
        <section className="overflow-hidden rounded-lg border border-cabinet-secondary/70 bg-cabinet-primary-dark text-white shadow-[0_22px_70px_-42px_rgba(7,54,36,0.9)]">
          <div className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cabinet-accent">
                Prochain patient à préparer
              </p>
              <h2 className="mt-1 font-heading text-3xl font-semibold">
                {nextPatient.patient.lastName} {nextPatient.patient.firstName}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/72">
                La salle d’attente se met à jour automatiquement après la validation d’une consultation.
              </p>
            </div>
            <WaitingStatusForm
              id={nextPatient.id}
              status={WaitingStatus.IN_PROGRESS}
              className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-cabinet-primary-dark shadow-sm transition hover:bg-cabinet-cream"
            >
              Marquer en consultation
            </WaitingStatusForm>
          </div>
        </section>
      )}

      <AddToWaitingForm patients={patientOptions} />

      <section className={`${ui.card} overflow-hidden p-0`}>
        <div className="border-b border-cabinet-border bg-cabinet-cream px-6 py-4">
          <p className={ui.eyebrow}>Flux en cours</p>
          <h2 className={ui.sectionTitle}>En attente / en consultation</h2>
        </div>
        <ul className={ui.cardList}>
          {active.length === 0 ? (
            <li className="px-6 py-12 text-center text-sm text-cabinet-muted">Personne en attente pour le moment.</li>
          ) : (
            active.map((entry, index) => (
              <li
                key={entry.id}
                className="grid gap-4 px-6 py-5 transition hover:bg-cabinet-cream/45 sm:grid-cols-[48px_1fr_auto] sm:items-center"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cabinet-border bg-cabinet-cream font-heading text-lg font-semibold text-cabinet-primary-dark">
                  {index + 1}
                </div>
                <div>
                  <p className="font-heading text-lg font-semibold text-cabinet-primary-dark">
                    {entry.patient.lastName} {entry.patient.firstName}
                  </p>
                  <p className="mt-1 text-sm text-cabinet-muted">
                    Arrivée : {new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(entry.arrivedAt)} ·{" "}
                    <span className="font-semibold text-cabinet-accent-dark">{entry.status}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {entry.status === WaitingStatus.WAITING && (
                    <WaitingStatusForm id={entry.id} status={WaitingStatus.IN_PROGRESS} className={ui.btnSecondary}>
                      En consultation
                    </WaitingStatusForm>
                  )}
                  <WaitingStatusForm id={entry.id} status={WaitingStatus.DONE} className={ui.btnPrimary}>
                    Terminé
                  </WaitingStatusForm>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      {done.length > 0 && (
        <section className={`${ui.cardCompact} border-dashed bg-cabinet-cream/70`}>
          <h3 className="mb-3 font-heading text-lg font-semibold text-cabinet-primary-dark">Traités aujourd’hui</h3>
          <ul className="flex flex-wrap gap-2 text-sm text-cabinet-muted">
            {done.map((entry) => (
              <li key={entry.id} className="rounded-md border border-cabinet-border bg-white px-3 py-1 text-cabinet-text">
                {entry.patient.lastName} {entry.patient.firstName}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
