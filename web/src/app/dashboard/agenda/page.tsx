import Link from "next/link";
import { addDays, startOfDay } from "date-fns";
import { redirect } from "next/navigation";
import { AppointmentStatus } from "@prisma/client";
import { AppointmentActionForm } from "@/components/appointment-actions";
import { hasPermission, requirePageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/ui-classes";

export default async function AgendaPage() {
  const user = await requirePageUser();
  if (!hasPermission(user, "permRdv")) redirect("/dashboard");

  const from = startOfDay(new Date());
  const to = addDays(from, 21);

  const appointments = await prisma.appointment.findMany({
    where: {
      start: { gte: from, lte: to },
      status: AppointmentStatus.SCHEDULED,
    },
    include: { patient: true },
    orderBy: { start: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-12">
      <section className={ui.pageHeader}>
        <div className={ui.pageHeaderInner}>
          <div>
            <p className={ui.eyebrow}>Planification clinique</p>
            <h1 className={ui.pageTitle}>Agenda</h1>
            <p className={ui.pageSubtitle}>Vue des créneaux confirmés sur les trois prochaines semaines.</p>
          </div>
          <Link href="/dashboard/agenda/new" className={ui.btnPrimary}>
            Nouveau RDV
          </Link>
        </div>
      </section>

      <section className={`${ui.card} overflow-hidden p-0`}>
        <div className="grid grid-cols-[96px_1fr_auto] gap-4 border-b border-cabinet-border bg-cabinet-primary-dark px-5 py-3 text-xs font-semibold uppercase text-white max-sm:hidden">
          <span>Heure</span>
          <span>Patient et motif</span>
          <span>Actions</span>
        </div>
        <ul className={ui.cardList}>
          {appointments.length === 0 ? (
            <li className="px-6 py-12 text-center text-sm text-cabinet-muted">Aucun rendez-vous sur cette période.</li>
          ) : (
            appointments.map((appointment) => (
              <li key={appointment.id} className="grid gap-4 px-5 py-5 transition hover:bg-cabinet-cream/55 sm:grid-cols-[96px_1fr_auto] sm:items-center">
                <div>
                  <p className="font-heading text-xl font-semibold text-cabinet-primary-dark">
                    {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(appointment.start)}
                  </p>
                  <p className="text-xs font-semibold text-cabinet-muted">
                    {new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(appointment.start)}
                  </p>
                </div>
                <div>
                  <p className="font-heading text-lg font-semibold text-cabinet-primary-dark">
                    {appointment.patient.lastName} {appointment.patient.firstName}
                  </p>
                  <p className="mt-1 text-sm text-cabinet-muted">
                    {new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" }).format(appointment.start)} ·{" "}
                    {new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(appointment.start)} →{" "}
                    {new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(appointment.end)}
                  </p>
                  <p className="mt-2 inline-flex rounded-md border border-cabinet-border bg-cabinet-cream px-2.5 py-1 text-xs font-semibold uppercase text-cabinet-accent-dark">
                    {appointment.type} · {appointment.motif}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <AppointmentActionForm id={appointment.id} kind="cancel" className={ui.btnGhost}>
                    Annuler
                  </AppointmentActionForm>
                  <AppointmentActionForm id={appointment.id} kind="delete" className={ui.btnDanger}>
                    Supprimer
                  </AppointmentActionForm>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <p className="text-center text-xs text-cabinet-muted">Les chevauchements sont bloqués à l’enregistrement.</p>
    </div>
  );
}
