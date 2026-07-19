import { redirect } from "next/navigation";
import { PaymentsLiveSearch } from "@/components/payments-live-search";
import { hasPermission, requirePageUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ui } from "@/lib/ui-classes";

function formatMad(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function PaymentsPage() {
  const user = await requirePageUser();
  if (!hasPermission(user, "permPaie")) redirect("/dashboard");

  const payments = await prisma.payment.findMany({
    orderBy: { paidAt: "desc" },
    take: 300,
    include: {
      patient: { select: { lastName: true, firstName: true } },
      invoice: { select: { label: true, expectedAmount: true, status: true } },
      consultation: { select: { type: true, date: true } },
    },
  });

  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const rows = payments.map((payment) => ({
    id: payment.id,
    paidAt: payment.paidAt.toISOString(),
    patientName: `${payment.patient.lastName} ${payment.patient.firstName}`,
    source: payment.invoice
      ? `${payment.invoice.label} - ${payment.invoice.status}`
      : payment.consultation
        ? `Consultation ${payment.consultation.type}`
        : "Paiement libre",
    method: payment.method,
    note: payment.note,
    amount: payment.amount,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-12">
      <section className={ui.pageHeader}>
        <div className={ui.pageHeaderInner}>
          <div>
            <p className={ui.eyebrow}>Suivi financier</p>
            <h1 className={ui.pageTitle}>Paiements</h1>
            <p className={ui.pageSubtitle}>
              Synthèse des encaissements par mode de paiement et historique récent filtrable.
            </p>
          </div>
          <div className="rounded-lg border border-cabinet-border bg-cabinet-cream px-5 py-3 text-right shadow-sm">
            <p className={ui.eyebrow}>Total chargé</p>
            <p className="font-heading text-2xl font-semibold tabular-nums text-cabinet-primary-dark">
              {formatMad(total)} MAD
            </p>
            <p className="mt-1 text-xs font-semibold text-cabinet-muted">
              {payments.length} derniers paiements
            </p>
          </div>
        </div>
      </section>

      <PaymentsLiveSearch payments={rows} />
    </div>
  );
}
