"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ui } from "@/lib/ui-classes";

type PatientOption = {
  id: string;
  lastName: string;
  firstName: string;
  phone?: string | null;
  cin?: string | null;
};

type Props = {
  patients: PatientOption[];
  name?: string;
  placeholder?: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function PatientCombobox({
  patients,
  name = "patientId",
  placeholder = "Saisir le nom du patient",
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PatientOption | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return patients;

    return patients
      .filter((patient) => {
        const haystack = normalize(
          `${patient.lastName} ${patient.firstName} ${patient.phone ?? ""} ${patient.cin ?? ""}`
        );
        return haystack.includes(needle);
      })
      .slice(0, 8);
  }, [patients, query]);

  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;

    const handleSubmit = (event: SubmitEvent) => {
      if (selected) return;

      event.preventDefault();
      setError("Veuillez choisir un patient dans la liste.");
      inputRef.current?.focus();
    };

    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, [selected]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const openList = () => {
    setOpen(true);
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerDownCapture={openList}
      onFocusCapture={openList}
      onClickCapture={openList}
      onTouchStartCapture={openList}
    >
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      <div className="relative">
        <input
          ref={inputRef}
          value={selected ? `${selected.lastName} ${selected.firstName}` : query}
          onChange={(event) => {
            setSelected(null);
            setQuery(event.target.value);
            setError("");
            setOpen(true);
          }}
          onFocus={() => {
            if (selected) {
              setQuery(`${selected.lastName} ${selected.firstName}`);
              setSelected(null);
            }
            setOpen(true);
          }}
          onPointerDown={openList}
          onClick={openList}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }
            if (event.key === "ArrowDown" || event.key === " ") {
              event.preventDefault();
              setOpen(true);
              return;
            }
            if (event.key === "Enter" && !selected && !open) {
              event.preventDefault();
              setOpen(true);
            }
          }}
          placeholder={placeholder}
          className={`${ui.input} pr-12 ${error ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        <button
          type="button"
          onClick={() => {
            inputRef.current?.focus();
            setOpen(true);
          }}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-cabinet-muted transition hover:bg-cabinet-cream hover:text-cabinet-primary-dark"
          aria-label="Afficher la liste des patients"
          title="Afficher la liste"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}

      {open && !selected && (
        <div className="absolute z-[999] mt-2 max-h-72 w-full overflow-auto rounded-md border border-cabinet-border bg-cabinet-card shadow-[0_20px_50px_-30px_rgba(7,54,36,0.55)]">
          {matches.length === 0 ? (
            <p className="px-4 py-3 text-sm text-cabinet-muted">Aucun patient correspondant.</p>
          ) : (
            matches.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => {
                  setSelected(patient);
                  setQuery("");
                  setError("");
                  setOpen(false);
                }}
                className="block w-full border-b border-cabinet-border/60 px-4 py-3 text-left last:border-b-0 hover:bg-cabinet-cream/70"
              >
                <span className="block font-heading text-base font-semibold text-cabinet-primary-dark">
                  {patient.lastName} {patient.firstName}
                </span>
                <span className="mt-1 block text-xs text-cabinet-muted">
                  {patient.phone ?? "Téléphone non renseigné"} · CIN: {patient.cin ?? "Non renseigné"}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
