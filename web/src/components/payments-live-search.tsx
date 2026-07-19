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

function normalize(value: string) {
  return value.trim().toLowerCase();
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

  return (
    <>
      <section className={`${ui.cardCompact} grid gap-3 md:grid-cols-[1fr_auto] md:items-center`}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher par patient, mode ou note"
          className={ui.input}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <div className="rounded-md border border-cabinet-border bg-cabinet-cream px-4 py-2 text-right">
          <p className="text-xs font-semibold uppercase text-cabinet-muted">Total filtré</p>
          <p className="font-heading text-xl font-semibold text-cabinet-primary-dark">{total.toFixed(2)} MAD</p>
        </div>
      </section>

      <section className={`${ui.card} overflow-hidden p-0`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
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
                      <span className={ui.chip}>{payment.method}</span>
                    </td>
                    <td className="px-5 py-4 text-cabinet-muted">{payment.note ?? "—"}</td>
                    <td className="px-5 py-4 text-right font-heading text-lg font-semibold text-cabinet-primary-dark">
                      {payment.amount.toFixed(2)} MAD
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
