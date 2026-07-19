import Link from "next/link";
import { addDays, startOfDay } from "date-fns";
import { AppointmentStatus, WaitingStatus } from "@prisma/client";
import { hasPermission, requirePageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/ui-classes";

export default async function DashboardHome() {
  const user = await requirePageUser();
  const today = startOfDay(new Date());
  const horizon = addDays(today, 14);

  const canRdv = hasPermission(user, "permRdv");
  const canFile = hasPermission(user, "permFile");
  const canPay = hasPermission(user, "permPaie");
  const canPatient =
    hasPermission(user, "permPatAdm") ||
    hasPermission(user, "permPatConst") ||
    hasPermission(user, "permPatMed");

  const [patientCount, todayAppts, waitingCount, revenueAgg] = await Promise.all([
    canPatient ? prisma.patient.count() : Promise.resolve(null),
    canRdv
      ? prisma.appointment.count({
          where: {
            status: AppointmentStatus.SCHEDULED,
            start: { gte: today, lt: addDays(today, 1) },
          },
        })
      : Promise.resolve(null),
    canFile
      ? prisma.waitingEntry.count({
          where: {
            day: today,
            status: { in: [WaitingStatus.WAITING, WaitingStatus.IN_PROGRESS] },
          },
        })
      : Promise.resolve(null),
    canPay
      ? prisma.payment.aggregate({
          where: { paidAt: { gte: today, lt: addDays(today, 1) } },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
  ]);

  const cards = [
    canPatient && { label: "Patients", value: String(patientCount), href: "/dashboard/patients", hint: "Fiches actives" },
    canRdv && { label: "Rendez-vous", value: String(todayAppts), href: "/dashboard/agenda", hint: "Aujourd’hui" },
    canFile && { label: "Salle d’attente", value: String(waitingCount), href: "/dashboard/waiting", hint: "Actifs" },
    canPay && {
      label: "Encaissements",
      value: `${revenueAgg?._sum.amount?.toFixed(2) ?? "0.00"} MAD`,
      href: "/dashboard/payments",
      hint: "Aujourd’hui",
    },
  ].filter(Boolean) as { label: string; value: string; href: string; hint: string }[];

  const upcoming = canRdv
    ? await prisma.appointment.findMany({
        where: {
          status: AppointmentStatus.SCHEDULED,
          start: { gte: new Date(), lte: horizon },
        },
        include: { patient: true },
        orderBy: { start: "asc" },
        take: 8,
      })
    : [];

  return (
    <div className={ui.pageWrap}>
      <section className={`${ui.pageHeader} bg-[linear-gradient(135deg,#fffdf8,rgba(216,200,165,0.22))]`}>
        <div className={ui.pageHeaderInner}>
          <div>
            <p className={ui.eyebrow}>Accueil cabinet</p>
            <h1 className={ui.pageTitle}>Tableau de bord</h1>
            <p className={ui.pageSubtitle}>Bonjour {user.name}, voici les indicateurs utiles à votre journée.</p>
          </div>
          {canRdv && (
            <Link href="/dashboard/agenda/new" className={ui.btnPrimary}>
              Nouveau rendez-vous
            </Link>
          )}
        </div>
      </section>

      {cards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Link key={card.label} href={card.href} className={`${ui.cardCompact} group min-h-36 border-l-4 border-l-cabinet-primary`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={ui.statLabel}>{card.label}</p>
                  <p className={ui.statValue}>{card.value}</p>
                </div>
                <span className={ui.chip}>{card.hint}</span>
              </div>
              <p className="mt-5 text-xs font-semibold text-cabinet-primary opacity-0 transition group-hover:opacity-100">
                Ouvrir le module →
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <section className={ui.card}>
          <p className="text-sm text-cabinet-muted">Aucun module n’est activé pour ce compte.</p>
        </section>
      )}

      {canRdv && (
        <section className={`${ui.card} overflow-hidden p-0`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cabinet-border bg-cabinet-cream px-6 py-4">
            <div>
              <p className={ui.eyebrow}>Planification</p>
              <h2 className={ui.sectionTitle}>Prochains rendez-vous</h2>
            </div>
            <span className={ui.chip}>14 jours</span>
          </div>
          {upcoming.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-cabinet-muted">Aucun rendez-vous à venir sur cette période.</p>
          ) : (
            <ul className={ui.cardList}>
              {upcoming.map((appointment) => (
                <li key={appointment.id} className={ui.row}>
                  <div>
                    <p className="font-heading text-lg font-semibold text-cabinet-primary-dark">
                      {appointment.patient.lastName} {appointment.patient.firstName}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase text-cabinet-accent-dark">{appointment.type}</p>
                  </div>
                  <div className="text-sm text-cabinet-muted sm:text-right">
                    <p className="font-semibold text-cabinet-text">
                      {new Intl.DateTimeFormat("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(appointment.start)}
                    </p>
                    <p className="max-w-xs truncate text-xs">{appointment.motif}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-cabinet-border px-6 py-4">
            <Link href="/dashboard/agenda" className={ui.link}>
              Voir l’agenda complet
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
