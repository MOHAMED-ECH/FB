import Link from "next/link";
import { addDays, startOfDay } from "date-fns";
import { getServerSession } from "next-auth";
import { AppointmentStatus, WaitingStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/ui-classes";

export default async function DashboardHome() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const today = startOfDay(new Date());
  const horizon = addDays(today, 14);

  const [patientCount, todayAppts, waitingCount, revenueAgg] = await Promise.all([
    prisma.patient.count(),
    prisma.appointment.count({
      where: {
        status: AppointmentStatus.SCHEDULED,
        start: { gte: today, lt: addDays(today, 1) },
      },
    }),
    prisma.waitingEntry.count({
      where: {
        day: today,
        status: { in: [WaitingStatus.WAITING, WaitingStatus.IN_PROGRESS] },
      },
    }),
    prisma.payment.aggregate({
      where: { paidAt: { gte: today, lt: addDays(today, 1) } },
      _sum: { amount: true },
    }),
  ]);

  const cards = [
    { label: "Patients enregistrés", value: String(patientCount), href: "/dashboard/patients", hint: "Fiches actives" },
    { label: "RDV aujourd’hui", value: String(todayAppts), href: "/dashboard/agenda", hint: "Créneaux planifiés" },
    { label: "Salle d’attente", value: String(waitingCount), href: "/dashboard/waiting", hint: "En cours + en attente" },
    {
      label: "Encaissements du jour",
      value: `${(revenueAgg._sum.amount ?? 0).toFixed(2)} €`,
      href: "/dashboard/payments",
      hint: "Période : aujourd’hui",
    },
  ];

  const upcoming = await prisma.appointment.findMany({
    where: {
      status: AppointmentStatus.SCHEDULED,
      start: { gte: new Date(), lte: horizon },
    },
    include: { patient: true },
    orderBy: { start: "asc" },
    take: 8,
  });

  return (
    <div className={ui.pageWrap}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className={ui.pageTitle}>Tableau de bord</h1>
          <p className={ui.pageSubtitle}>Bonjour {session.user.name} — voici l’essentiel du cabinet.</p>
        </div>
        <Link href="/dashboard/agenda/new" className={ui.btnPrimary}>
          + Nouveau rendez-vous
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`${ui.cardCompact} group flex flex-col justify-between hover:-translate-y-0.5`}
          >
            <div>
              <p className={ui.statLabel}>{c.label}</p>
              <p className={ui.statValue}>{c.value}</p>
              <p className="mt-2 text-xs text-cabinet-muted/90">{c.hint}</p>
            </div>
            <span className="mt-4 text-xs font-semibold text-cabinet-accent-dark opacity-0 transition group-hover:opacity-100">
              Ouvrir →
            </span>
          </Link>
        ))}
      </div>

      <section className={ui.card}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-semibold text-cabinet-primary">Prochains rendez-vous</h2>
          <span className="rounded-full bg-cabinet-primary/10 px-3 py-1 text-xs font-medium text-cabinet-primary">
            14 jours
          </span>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-cabinet-muted">Aucun rendez-vous à venir sur cette période.</p>
        ) : (
          <ul className={ui.cardList}>
            {upcoming.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-cabinet-text">
                    {a.patient.lastName} {a.patient.firstName}
                  </p>
                  <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-cabinet-accent-dark">
                    {a.type}
                  </p>
                </div>
                <div className="text-right text-sm text-cabinet-muted">
                  <p className="font-medium text-cabinet-text">
                    {new Intl.DateTimeFormat("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(a.start)}
                  </p>
                  <p className="max-w-xs truncate text-xs">{a.motif}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link href="/dashboard/agenda" className={`${ui.link} mt-6 inline-block`}>
          Voir l’agenda complet
        </Link>
      </section>
    </div>
  );
}
