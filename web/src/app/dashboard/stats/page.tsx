import Link from "next/link";
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { redirect } from "next/navigation";
import { AppointmentStatus, ConsultationType, InvoiceStatus, WaitingStatus } from "@prisma/client";
import { hasPermission, isDoctor, requirePageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/ui-classes";

type SearchParams = Promise<{ period?: string; from?: string; to?: string }>;

const periodOptions = [
  { key: "today", label: "Aujourd'hui" },
  { key: "7d", label: "7 jours" },
  { key: "month", label: "Mois courant" },
  { key: "previous-month", label: "Mois précédent" },
] as const;

const consultationLabels: Record<ConsultationType, string> = {
  FIRST: "Première consultation",
  CONTROL: "Contrôle",
  OTHER: "Autre",
};

const appointmentLabels: Record<AppointmentStatus, string> = {
  SCHEDULED: "Planifiés",
  CANCELLED: "Annulés",
  DONE: "Terminés",
  NO_SHOW: "Non honorés",
};

const paymentLabels: Record<string, string> = {
  CASH: "Espèces",
  CARD: "Carte",
  CHEQUE: "Chèque",
  TRANSFER: "Virement",
};

function formatMad(amount: number | null | undefined) {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0)} MAD`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function trend(current: number, previous: number | null) {
  if (previous === null) return null;
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const value = Math.round(((current - previous) / previous) * 100);
  return `${value > 0 ? "+" : ""}${value}%`;
}

function parseDateParam(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function periodLabel(from: Date, to: Date) {
  return `Du ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(from)} au ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(to)}`;
}

function selectedPeriod(params: { period?: string; from?: string; to?: string }) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const customFrom = parseDateParam(params.from);
  const customTo = parseDateParam(params.to);

  if (customFrom && customTo) {
    const from = customFrom <= customTo ? customFrom : customTo;
    const to = customFrom <= customTo ? customTo : customFrom;

    return {
      key: "custom",
      from: startOfDay(from),
      to: endOfDay(to),
      label: periodLabel(from, to),
    };
  }

  if (params.period === "today") {
    return {
      key: "today",
      from: todayStart,
      to: endOfDay(now),
      label: "Aujourd'hui",
    };
  }

  if (params.period === "7d") {
    return {
      key: "7d",
      from: startOfDay(subDays(now, 6)),
      to: endOfDay(now),
      label: "7 derniers jours",
    };
  }

  if (params.period === "previous-month") {
    const previous = subMonths(now, 1);
    return {
      key: "previous-month",
      from: startOfMonth(previous),
      to: endOfMonth(previous),
      label: new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(previous),
    };
  }

  return {
    key: "month",
    from: startOfMonth(now),
    to: endOfMonth(now),
    label: new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(now),
  };
}

function previousPeriod(from: Date, to: Date) {
  const days = differenceInCalendarDays(to, from) + 1;
  const previousTo = subDays(from, 1);
  const previousFrom = subDays(previousTo, days - 1);
  return { previousFrom: startOfDay(previousFrom), previousTo: endOfDay(previousTo) };
}

function shortDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(value);
}

function sameDayKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function StatCard({
  label,
  value,
  detail,
  tone = "neutral",
  trendLabel,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "good" | "warning" | "danger";
  trendLabel?: string | null;
}) {
  const toneClass =
    tone === "good"
      ? "border-l-emerald-500 bg-emerald-50/55"
      : tone === "warning"
        ? "border-l-amber-500 bg-amber-50/60"
        : tone === "danger"
          ? "border-l-red-500 bg-red-50/55"
          : "border-l-cabinet-secondary bg-cabinet-card";

  return (
    <article className={`rounded-lg border border-cabinet-border border-l-4 p-4 shadow-[0_14px_38px_-30px_rgba(7,54,36,0.42)] ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <p className={ui.statLabel}>{label}</p>
        {trendLabel && (
          <span className="rounded-md border border-cabinet-border bg-white/80 px-2 py-1 text-xs font-semibold text-cabinet-primary-dark">
            {trendLabel}
          </span>
        )}
      </div>
      <p className={ui.statValue}>{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-cabinet-muted">{detail}</p>
    </article>
  );
}

function BarList({ rows }: { rows: { label: string; value: number; amount?: boolean }[] }) {
  const max = Math.max(...rows.map((row) => row.value), 0);

  return (
    <ul className="space-y-3">
      {rows.length === 0 ? (
        <li className="rounded-md border border-dashed border-cabinet-border bg-cabinet-cream/40 px-4 py-8 text-center text-sm text-cabinet-muted">
          Aucune donnée sur cette période.
        </li>
      ) : (
        rows.map((row) => {
          const width = max > 0 ? Math.max(6, Math.round((row.value / max) * 100)) : 0;
          return (
            <li key={row.label} className="grid gap-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-semibold text-cabinet-primary-dark">{row.label}</span>
                <span className="font-heading font-semibold tabular-nums text-cabinet-primary-dark">
                  {row.amount ? formatMad(row.value) : formatNumber(row.value)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-cabinet-cream ring-1 ring-cabinet-border/70">
                <div className="h-full rounded-full bg-cabinet-primary" style={{ width: `${width}%` }} aria-hidden />
              </div>
            </li>
          );
        })
      )}
    </ul>
  );
}

function AlertItem({ title, detail, tone }: { title: string; detail: string; tone: "warning" | "danger" | "good" }) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-900"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-emerald-200 bg-emerald-50 text-emerald-900";

  return (
    <li className={`rounded-md border px-4 py-3 ${toneClass}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 opacity-80">{detail}</p>
    </li>
  );
}

export default async function StatsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePageUser();
  if (!hasPermission(user, "permStats")) redirect("/dashboard");

  const params = await searchParams;
  const period = selectedPeriod(params);
  const { previousFrom, previousTo } = previousPeriod(period.from, period.to);
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const doctor = isDoctor(user);
  const canPay = hasPermission(user, "permPaie");
  const canRdv = hasPermission(user, "permRdv");
  const canFile = hasPermission(user, "permFile");
  const canPatients = hasPermission(user, "permPatAdm") || hasPermission(user, "permPatMed");

  const [
    consultCount,
    consultPrevious,
    byType,
    consultationsByDay,
    patientCount,
    newPatients,
    revenue,
    previousRevenue,
    revenueByMethod,
    revenueByDay,
    openInvoices,
    appointmentCounts,
    apptFuture7Days,
    waitingToday,
    waitingDoneToday,
    documentsAdded,
  ] = await Promise.all([
    doctor
      ? prisma.consultation.count({ where: { date: { gte: period.from, lte: period.to } } })
      : Promise.resolve(null),
    doctor
      ? prisma.consultation.count({ where: { date: { gte: previousFrom, lte: previousTo } } })
      : Promise.resolve(null),
    doctor
      ? prisma.consultation.groupBy({
          by: ["type"],
          where: { date: { gte: period.from, lte: period.to } },
          _count: { _all: true },
        })
      : Promise.resolve([] as { type: ConsultationType; _count: { _all: number } }[]),
    doctor
      ? prisma.consultation.findMany({
          where: { date: { gte: period.from, lte: period.to } },
          select: { date: true },
        })
      : Promise.resolve([] as { date: Date }[]),
    canPatients ? prisma.patient.count() : Promise.resolve(null),
    canPatients
      ? prisma.patient.count({ where: { createdAt: { gte: period.from, lte: period.to } } })
      : Promise.resolve(null),
    canPay
      ? prisma.payment.aggregate({
          where: { paidAt: { gte: period.from, lte: period.to } },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
    canPay
      ? prisma.payment.aggregate({
          where: { paidAt: { gte: previousFrom, lte: previousTo } },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
    canPay
      ? prisma.payment.groupBy({
          by: ["method"],
          where: { paidAt: { gte: period.from, lte: period.to } },
          _sum: { amount: true },
          _count: { _all: true },
        })
      : Promise.resolve([] as { method: string; _sum: { amount: number | null }; _count: { _all: number } }[]),
    canPay
      ? prisma.payment.findMany({
          where: { paidAt: { gte: period.from, lte: period.to } },
          select: { paidAt: true, amount: true },
        })
      : Promise.resolve([] as { paidAt: Date; amount: number }[]),
    canPay
      ? prisma.consultationInvoice.findMany({
          where: { status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] } },
          include: { payments: { select: { amount: true } } },
        })
      : Promise.resolve([] as { expectedAmount: number; payments: { amount: number }[]; status: InvoiceStatus }[]),
    canRdv
      ? prisma.appointment.groupBy({
          by: ["status"],
          where: { start: { gte: period.from, lte: period.to } },
          _count: { _all: true },
        })
      : Promise.resolve([] as { status: AppointmentStatus; _count: { _all: number } }[]),
    canRdv
      ? prisma.appointment.count({
          where: { status: AppointmentStatus.SCHEDULED, start: { gte: now, lte: addDays(now, 7) } },
        })
      : Promise.resolve(null),
    canFile
      ? prisma.waitingEntry.count({ where: { day: { gte: todayStart, lte: todayEnd } } })
      : Promise.resolve(null),
    canFile
      ? prisma.waitingEntry.count({
          where: { day: { gte: todayStart, lte: todayEnd }, status: WaitingStatus.DONE },
        })
      : Promise.resolve(null),
    doctor
      ? prisma.medicalDocument.count({ where: { createdAt: { gte: period.from, lte: period.to } } })
      : Promise.resolve(null),
  ]);

  const revenueAmount = revenue?._sum.amount ?? 0;
  const previousRevenueAmount = previousRevenue?._sum.amount ?? 0;
  const dueAmount = openInvoices.reduce((sum, invoice) => {
    const paid = invoice.payments.reduce((total, payment) => total + payment.amount, 0);
    return sum + Math.max(invoice.expectedAmount - paid, 0);
  }, 0);
  const unpaidInvoices = openInvoices.filter((invoice) => invoice.status === InvoiceStatus.UNPAID).length;
  const partialInvoices = openInvoices.filter((invoice) => invoice.status === InvoiceStatus.PARTIAL).length;

  const scheduled = appointmentCounts.find((row) => row.status === AppointmentStatus.SCHEDULED)?._count._all ?? 0;
  const cancelled = appointmentCounts.find((row) => row.status === AppointmentStatus.CANCELLED)?._count._all ?? 0;
  const done = appointmentCounts.find((row) => row.status === AppointmentStatus.DONE)?._count._all ?? 0;
  const noShow = appointmentCounts.find((row) => row.status === AppointmentStatus.NO_SHOW)?._count._all ?? 0;
  const trackedPast = done + noShow;
  const noShowRate = percent(noShow, trackedPast);
  const cancelledRate = percent(cancelled, scheduled + cancelled + done + noShow);

  const days = Array.from({ length: differenceInCalendarDays(period.to, period.from) + 1 }, (_, index) =>
    addDays(period.from, index)
  );
  const consultationSeries = days.map((day) => {
    const key = sameDayKey(day);
    return {
      label: shortDate(day),
      value: consultationsByDay.filter((row) => sameDayKey(row.date) === key).length,
    };
  });
  const revenueSeries = days.map((day) => {
    const key = sameDayKey(day);
    return {
      label: shortDate(day),
      value: revenueByDay
        .filter((row) => sameDayKey(row.paidAt) === key)
        .reduce((sum, row) => sum + row.amount, 0),
      amount: true,
    };
  });

  const activityCards = [
    doctor &&
      consultCount !== null && {
        label: "Consultations",
        value: formatNumber(consultCount),
        detail: `Période : ${period.label}`,
        trendLabel: trend(consultCount, consultPrevious),
        tone: "neutral" as const,
      },
    canPatients &&
      patientCount !== null && {
        label: "Patients",
        value: formatNumber(patientCount),
        detail: `${formatNumber(newPatients ?? 0)} nouveaux sur la période`,
        tone: "neutral" as const,
      },
    canFile &&
      waitingToday !== null && {
        label: "Salle d'attente",
        value: formatNumber(waitingToday),
        detail: `${formatNumber(waitingDoneToday ?? 0)} passages terminés aujourd'hui`,
        tone: "good" as const,
      },
    doctor &&
      documentsAdded !== null && {
        label: "Documents",
        value: formatNumber(documentsAdded),
        detail: "Documents médicaux ajoutés sur la période",
        tone: "neutral" as const,
      },
  ].filter(Boolean) as {
    label: string;
    value: string;
    detail: string;
    trendLabel?: string | null;
    tone: "neutral" | "good" | "warning" | "danger";
  }[];

  const financeCards = [
    canPay && {
      label: "Encaissements",
      value: formatMad(revenueAmount),
      detail: `Période précédente : ${formatMad(previousRevenueAmount)}`,
      trendLabel: trend(revenueAmount, previousRevenueAmount),
      tone: "good" as const,
    },
    canPay && {
      label: "Reste à encaisser",
      value: formatMad(dueAmount),
      detail: `${unpaidInvoices} impayées, ${partialInvoices} partielles`,
      tone: dueAmount > 0 ? ("warning" as const) : ("good" as const),
    },
  ].filter(Boolean) as {
    label: string;
    value: string;
    detail: string;
    trendLabel?: string | null;
    tone: "neutral" | "good" | "warning" | "danger";
  }[];

  const agendaCards = [
    canRdv && {
      label: "RDV à venir",
      value: formatNumber(apptFuture7Days ?? 0),
      detail: "Planifiés sur les 7 prochains jours",
      tone: "neutral" as const,
    },
    canRdv && {
      label: "RDV annulés",
      value: formatNumber(cancelled),
      detail: `${cancelledRate}% des RDV de la période`,
      tone: cancelledRate >= 20 ? ("warning" as const) : ("neutral" as const),
    },
    canRdv && {
      label: "RDV non honorés",
      value: `${noShowRate}%`,
      detail: `${formatNumber(noShow)} absence${noShow > 1 ? "s" : ""} sur ${formatNumber(trackedPast)} RDV clôturés`,
      tone: noShowRate >= 15 ? ("danger" as const) : noShowRate > 0 ? ("warning" as const) : ("good" as const),
    },
  ].filter(Boolean) as {
    label: string;
    value: string;
    detail: string;
    tone: "neutral" | "good" | "warning" | "danger";
  }[];

  const alerts = [
    canPay &&
      dueAmount > 0 && {
        title: "Encaissements à suivre",
        detail: `${formatMad(dueAmount)} restent ouverts sur les factures non soldées.`,
        tone: "warning" as const,
      },
    canRdv &&
      noShowRate >= 15 && {
        title: "Taux de RDV non honorés élevé",
        detail: `${noShowRate}% sur les rendez-vous clôturés de la période.`,
        tone: "danger" as const,
      },
    canRdv &&
      (apptFuture7Days ?? 0) === 0 && {
        title: "Agenda à surveiller",
        detail: "Aucun rendez-vous planifié sur les 7 prochains jours.",
        tone: "warning" as const,
      },
    canPay &&
      dueAmount === 0 && {
        title: "Facturation à jour",
        detail: "Aucun reste à encaisser détecté sur les factures ouvertes.",
        tone: "good" as const,
      },
  ].filter(Boolean) as { title: string; detail: string; tone: "warning" | "danger" | "good" }[];

  const consultationTypeRows = byType.map((row) => ({
    label: consultationLabels[row.type],
    value: row._count._all,
  }));
  const paymentMethodRows = revenueByMethod.map((row) => ({
    label: paymentLabels[row.method] ?? row.method,
    value: row._sum.amount ?? 0,
    amount: true,
  }));
  const appointmentRows = appointmentCounts.map((row) => ({
    label: appointmentLabels[row.status],
    value: row._count._all,
  }));

  return (
    <div className={ui.pageWrap}>
      <section className={ui.pageHeader}>
        <div className={ui.pageHeaderInner}>
          <div>
            <p className={ui.eyebrow}>Pilotage cabinet</p>
            <h1 className={ui.pageTitle}>Statistiques</h1>
            <p className={ui.pageSubtitle}>
              Vue consolidée pour suivre l&apos;activité, les encaissements et les points qui demandent attention.
            </p>
          </div>
          <div className="grid gap-3 md:min-w-[430px]">
            <div className="flex flex-wrap gap-2 md:justify-end">
              {periodOptions.map((option) => {
                const active = option.key === period.key;
                return (
                  <Link
                    key={option.key}
                    href={`/dashboard/stats?period=${option.key}`}
                    className={
                      active
                        ? "rounded-md bg-cabinet-primary px-3 py-2 text-xs font-semibold text-white shadow-sm"
                        : "rounded-md border border-cabinet-border bg-white px-3 py-2 text-xs font-semibold text-cabinet-primary-dark transition hover:bg-cabinet-cream"
                    }
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>
            <form action="/dashboard/stats" className="grid gap-2 rounded-md border border-cabinet-border bg-white/80 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label>
                <span className="mb-1 block text-[11px] font-semibold uppercase text-cabinet-muted">Du</span>
                <input type="date" name="from" defaultValue={dateInputValue(period.from)} className={ui.input} />
              </label>
              <label>
                <span className="mb-1 block text-[11px] font-semibold uppercase text-cabinet-muted">Au</span>
                <input type="date" name="to" defaultValue={dateInputValue(period.to)} className={ui.input} />
              </label>
              <button type="submit" className={ui.btnPrimary}>
                Appliquer
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...activityCards, ...financeCards, ...agendaCards].map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <article className={ui.card}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={ui.eyebrow}>Points d&apos;attention</p>
              <h2 className={ui.sectionTitle}>À surveiller</h2>
            </div>
            <span className={ui.chip}>{period.label}</span>
          </div>
          <ul className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert) => <AlertItem key={alert.title} {...alert} />)
            ) : (
              <AlertItem title="Situation stable" detail="Aucun signal prioritaire détecté sur cette période." tone="good" />
            )}
          </ul>
        </article>

        {canRdv && (
          <article className={ui.card}>
            <div className="mb-5">
              <p className={ui.eyebrow}>Agenda</p>
              <h2 className={ui.sectionTitle}>Répartition des RDV</h2>
            </div>
            <BarList rows={appointmentRows} />
          </article>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {doctor && (
          <article className={ui.card}>
            <div className="mb-5">
              <p className={ui.eyebrow}>Activité médicale</p>
              <h2 className={ui.sectionTitle}>Consultations par jour</h2>
            </div>
            <BarList rows={consultationSeries.filter((row) => row.value > 0)} />
          </article>
        )}

        {doctor && (
          <article className={ui.card}>
            <div className="mb-5">
              <p className={ui.eyebrow}>Typologie</p>
              <h2 className={ui.sectionTitle}>Consultations par type</h2>
            </div>
            <BarList rows={consultationTypeRows} />
          </article>
        )}

        {canPay && (
          <article className={ui.card}>
            <div className="mb-5">
              <p className={ui.eyebrow}>Finance</p>
              <h2 className={ui.sectionTitle}>Encaissements par mode</h2>
            </div>
            <BarList rows={paymentMethodRows} />
          </article>
        )}

        {canPay && (
          <article className={ui.card}>
            <div className="mb-5">
              <p className={ui.eyebrow}>Tendance</p>
              <h2 className={ui.sectionTitle}>Encaissements par jour</h2>
            </div>
            <BarList rows={revenueSeries.filter((row) => row.value > 0)} />
          </article>
        )}
      </section>
    </div>
  );
}
