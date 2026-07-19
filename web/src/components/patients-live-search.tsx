"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ui } from "@/lib/ui-classes";

type PatientRow = {
  id: string;
  lastName: string;
  firstName: string;
  phone: string;
  coverageType: string;
  cin: string | null;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function PatientsLiveSearch({ patients }: { patients: PatientRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return patients;

    return patients.filter((patient) =>
      normalize(`${patient.lastName} ${patient.firstName} ${patient.phone} ${patient.cin ?? ""}`).includes(needle)
    );
  }, [patients, query]);

  return (
    <>
      <section className={`${ui.cardCompact} grid gap-3`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par nom, prénom, téléphone ou CIN"
            className={ui.input}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className={ui.btnGhost}>
              Réinitialiser
            </button>
          )}
        </div>
        <p className="text-xs font-semibold uppercase text-cabinet-muted">
          {filtered.length} patient{filtered.length > 1 ? "s" : ""} correspondant{filtered.length > 1 ? "s" : ""}
        </p>
      </section>

      <section className={`${ui.card} overflow-hidden p-0`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className={ui.tableHead}>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Téléphone</th>
                <th className="px-5 py-3">Couverture</th>
                <th className="px-5 py-3 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cabinet-border/70">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-cabinet-muted">
                    Aucun patient trouvé.
                  </td>
                </tr>
              ) : (
                filtered.map((patient) => (
                  <tr key={patient.id} className="transition hover:bg-cabinet-cream/50">
                    <td className="px-5 py-4">
                      <p className="font-heading text-lg font-semibold text-cabinet-primary-dark">
                        {patient.lastName} {patient.firstName}
                      </p>
                      <p className="mt-1 text-xs text-cabinet-muted">CIN: {patient.cin ?? "Non renseigné"}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-cabinet-text">{patient.phone}</td>
                    <td className="px-5 py-4 text-cabinet-muted">{patient.coverageType}</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/dashboard/patients/${patient.id}`} className={ui.btnSecondary}>
                        Ouvrir
                      </Link>
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
