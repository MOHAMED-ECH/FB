"use client";

import { useMemo, useState } from "react";
import { ui } from "@/lib/ui-classes";

type AuditLogRow = {
  id: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  meta: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function AuditLiveSearch({ logs }: { logs: AuditLogRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return logs;

    return logs.filter((log) =>
      normalize(`${log.userName} ${log.userEmail} ${log.action} ${log.resource} ${log.meta}`).includes(needle)
    );
  }, [logs, query]);

  return (
    <>
      <section className={`${ui.cardCompact} grid gap-3 md:grid-cols-[1fr_auto] md:items-center`}>
        <div className="relative">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher action, ressource, utilisateur ou détail"
            className={`${ui.input} ${query ? "pr-28" : ""}`}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-cabinet-border bg-white px-3 py-1.5 text-xs font-semibold text-cabinet-primary-dark shadow-sm transition hover:bg-cabinet-cream"
            >
              Effacer
            </button>
          )}
        </div>
        <div className="rounded-md border border-cabinet-border bg-cabinet-cream px-4 py-2 text-right">
          <p className="text-xs font-semibold uppercase text-cabinet-muted">Résultat</p>
          <p className="font-heading text-xl font-semibold text-cabinet-primary-dark">
            {filtered.length} événement{filtered.length > 1 ? "s" : ""}
          </p>
        </div>
      </section>

      <section className={`${ui.card} overflow-hidden p-0`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className={ui.tableHead}>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Ressource</th>
                <th className="px-4 py-3">Détail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cabinet-border/70">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-cabinet-muted">
                    Aucun événement trouvé.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-cabinet-cream/40">
                    <td className="whitespace-nowrap px-4 py-4 text-cabinet-muted">
                      {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium" }).format(
                        new Date(log.createdAt)
                      )}
                    </td>
                    <td className="px-4 py-4 font-semibold text-cabinet-primary-dark">
                      {log.userName || log.userEmail || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span className={ui.chip}>{log.action}</span>
                    </td>
                    <td className="px-4 py-4 text-cabinet-muted">{log.resource}</td>
                    <td className="max-w-xs truncate px-4 py-4 text-xs text-cabinet-muted">{log.meta}</td>
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
