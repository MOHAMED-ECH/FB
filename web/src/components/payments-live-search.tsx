"use client";

import { useMemo, useState } from "react";
import { ui } from "@/lib/ui-classes";

type PaymentRow = {
  id: string;
  paidAt: string;
  patientName: string;
  source: string;
  method: string;
  note: string | null;
  amount: number;
};

const methodCards = [
  {
    key: "CASH",
    label: "Espèces",
    detail: "Encaissements au comptoir",
    accent: "border-l-emerald-500 bg-emerald-50/55",
    badge: "border-emerald-200 bg-emerald-100 text-emerald-900",
    bar: "bg-emerald-600",
  },
  {
    key: "CARD",
    label: "Carte",
    detail: "Paiements par TPE",
    accent: "border-l-sky-500 bg-sky-50/60",
    badge: "border-sky-200 bg-sky-100 text-sky-950",
    bar: "bg-sky-600",
  },
  {
    key: "TRANSFER",
    label: "Virement",
    detail: "Transferts bancaires",
    accent: "border-l-indigo-500 bg-indigo-50/55",
    badge: "border-indigo-200 bg-indigo-100 text-indigo-950",
    bar: "bg-indigo-600",
  },
  {
    key: "CHEQUE",
    label: "Chèque",
    detail: "Chèques reçus",
    accent: "border-l-amber-500 bg-amber-50/65",
    badge: "border-amber-200 bg-amber-100 text-amber-950",
    bar: "bg-amber-600",
  },
] as const;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function formatMad(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function methodLabel(method: string) {
  return methodCards.find((item) => item.key === method)?.label ?? method;
}

export function PaymentsLiveSearch({ payments }: { payments: PaymentRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return payments;

    return payments.filter((payment) =>
      normalize(`${payment.patientName} ${payment.source} ${payment.method} ${payment.note ?? ""}`).includes(needle)
    );
  }, [payments, query]);

  const total = filtered.reduce((sum, payment) => sum + payment.amount, 0);
  const methodTotals = methodCards.map((method) => {
    const matching = filtered.filter((payment) => payment.method === method.key);
    const amount = matching.reduce((sum, payment) => sum + payment.amount, 0);
    const share = total > 0 ? Math.round((amount / total) * 100) : 0;

    return {
      ...method,
      amount,
      count: matching.length,
      share,
    };
  });

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {methodTotals.map((method) => (
          <article
            key={method.key}
            className={`rounded-lg border border-cabinet-border border-l-4 p-4 shadow-[0_16px_42px_-34px_rgba(7,54,36,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_58px_-38px_rgba(15,90,63,0.5)] ${method.accent}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-cabinet-muted">Mode</p>
                <h2 className="mt-1 font-heading text-xl font-semibold text-cabinet-primary-dark">{method.label}</h2>
              </div>
              <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${method.badge}`}>
                {method.count}
              </span>
            </div>

            <p className="mt-4 font-heading text-2xl font-semibold tabular-nums text-cabinet-primary-dark">
              {formatMad(method.amount)} MAD
            </p>
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-cabinet-border/70">
                <div className={`h-full rounded-full ${method.bar}`} style={{ width: `${method.share}%` }} aria-hidden />
              </div>
              <p className="mt-2 text-xs font-semibold leading-5 text-cabinet-muted">
                {method.share}% du total affiché - {method.detail}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className={`${ui.cardCompact} grid gap-4 md:grid-cols-[1fr_auto] md:items-center`}>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase text-cabinet-primary-dark">
            Rechercher
          </label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Patient, mode, facture ou note"
            className={ui.input}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <div className="grid gap-2 rounded-md border border-cabinet-border bg-cabinet-cream px-4 py-3 text-right sm:min-w-56">
          <p className="text-xs font-semibold uppercase text-cabinet-muted">Total affiché</p>
          <p className="font-heading text-2xl font-semibold tabular-nums text-cabinet-primary-dark">
            {formatMad(total)} MAD
          </p>
          <p className="text-xs font-semibold text-cabinet-muted">
            {filtered.length} paiement{filtered.length > 1 ? "s" : ""}
          </p>
        </div>
      </section>

      <section className={`${ui.card} overflow-hidden p-0`}>
        <div className="border-b border-cabinet-border bg-cabinet-cream px-5 py-4">
          <p className={ui.eyebrow}>Journal des encaissements</p>
          <h2 className={ui.sectionTitle}>Paiements récents</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className={ui.tableHead}>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Origine</th>
                <th className="px-5 py-3">Mode</th>
                <th className="px-5 py-3">Note</th>
                <th className="px-5 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cabinet-border/70">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-cabinet-muted">
                    Aucun paiement trouvé.
                  </td>
                </tr>
              ) : (
                filtered.map((payment) => (
                  <tr key={payment.id} className="hover:bg-cabinet-cream/40">
                    <td className="px-5 py-4 text-cabinet-muted">
                      {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(payment.paidAt))}
                    </td>
                    <td className="px-5 py-4 font-heading text-lg font-semibold text-cabinet-primary-dark">
                      {payment.patientName}
                    </td>
                    <td className="px-5 py-4 text-cabinet-muted">{payment.source}</td>
                    <td className="px-5 py-4">
                      <span className={ui.chip}>{methodLabel(payment.method)}</span>
                    </td>
                    <td className="px-5 py-4 text-cabinet-muted">{payment.note ?? "-"}</td>
                    <td className="px-5 py-4 text-right font-heading text-lg font-semibold tabular-nums text-cabinet-primary-dark">
                      {formatMad(payment.amount)} MAD
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
