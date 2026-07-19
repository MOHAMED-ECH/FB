import { endOfMonth, startOfMonth } from "date-fns";
import { redirect } from "next/navigation";
import { AppointmentStatus, ConsultationType } from "@prisma/client";
import { hasPermission, isDoctor, requirePageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/ui-classes";

function formatMad(amount: number | null | undefined) {
  return `${(amount ?? 0).toFixed(2)} MAD`;
}

export default async function StatsPage() {
  const user = await requirePageUser();
  if (!hasPermission(user, "permStats")) redirect("/dashboard");

  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);
  const doctor = isDoctor(user);

  const [consultCount, patientCount, revenue, apptFuture, byType] = await Promise.all([
    doctor ? prisma.consultation.count({ where: { date: { gte: from, lte: to } } }) : Promise.resolve(null),
    hasPermission(user, "permPatAdm") || hasPermission(user, "permPatMed") ? prisma.patient.count() : Promise.resolve(null),
    hasPermission(user, "permPaie")
      ? prisma.payment.aggregate({
          where: { paidAt: { gte: from, lte: to } },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
    hasPermission(user, "permRdv")
      ? prisma.appointment.count({
          where: { status: AppointmentStatus.SCHEDULED, start: { gte: now } },
        })
      : Promise.resolve(null),
    doctor
      ? prisma.consultation.groupBy({
          by: ["type"],
          where: { date: { gte: from, lte: to } },
          _count: { _all: true },
        })
      : Promise.resolve([] as { type: ConsultationType; _count: { _all: number } }[]),
  ]);

  const stats = [
    consultCount !== null && { label: "Consultations", value: String(consultCount), detail: "ce mois" },
    revenue !== null && { label: "Encaissements", value: formatMad(revenue._sum.amount), detail: "ce mois" },
    patientCount !== null && { label: "Patients", value: String(patientCount), detail: "enregistrés" },
    apptFuture !== null && { label: "RDV", value: String(apptFuture), detail: "à venir" },
  ].filter(Boolean) as { label: string; value: string; detail: string }[];

  return (
    <div className={ui.pageWrap}>
      <section className={ui.pageHeader}>
        <div className={ui.pageHeaderInner}>
          <div>
            <p className={ui.eyebrow}>Pilotage cabinet</p>
            <h1 className={ui.pageTitle}>Statistiques</h1>
            <p className={ui.pageSubtitle}>
              {new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(from)} — vue consolidée.
            </p>
          </div>
          <span className={ui.chip}>Devise: MAD</span>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`${ui.cardCompact} border-l-4 border-l-cabinet-secondary`}>
            <p className={ui.statLabel}>{stat.label}</p>
            <p className={ui.statValue}>{stat.value}</p>
            <p className="mt-2 text-xs font-semibold text-cabinet-muted">{stat.detail}</p>
          </div>
        ))}
      </div>

      {doctor && byType.length > 0 && (
        <section className={`${ui.card} overflow-hidden p-0`}>
          <div className="border-b border-cabinet-border bg-cabinet-cream px-6 py-4">
            <p className={ui.eyebrow}>Activité médicale</p>
            <h2 className={ui.sectionTitle}>Consultations par type</h2>
          </div>
          <ul className={ui.cardList}>
            {byType.map((row) => (
              <li key={row.type} className="flex items-center justify-between gap-4 px-6 py-4">
                <span className="font-semibold text-cabinet-primary-dark">{row.type}</span>
                <span className={ui.chip}>{row._count._all}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
