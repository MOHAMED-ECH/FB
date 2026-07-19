"use client";

import { useEffect, useState, type ReactNode } from "react";

type ConsultationModalProps = {
  children: ReactNode;
  triggerLabel?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  triggerClassName?: string;
};

export function ConsultationModal({
  children,
  triggerLabel = "Nouvelle consultation",
  eyebrow = "Consultation médecin",
  title = "Nouvelle consultation",
  description = "Le compte rendu, la facture et le prochain RDV sont validés ensemble.",
  triggerClassName,
}: ConsultationModalProps) {
  const [open, setOpen] = useState(false);
  const defaultTriggerClass =
    "inline-flex items-center justify-center rounded-md bg-cabinet-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_34px_-22px_rgba(7,54,36,0.85)] transition hover:bg-cabinet-primary-dark active:scale-[0.99]";

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName ?? defaultTriggerClass}
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-cabinet-primary-dark/72 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-cabinet-border bg-cabinet-card shadow-[0_30px_90px_-40px_rgba(0,0,0,0.75)]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-cabinet-border bg-cabinet-primary-dark px-6 py-5 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cabinet-accent">
                  {eyebrow}
                </p>
                <h2 className="mt-1 font-heading text-2xl font-semibold">{title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
                  {description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-white/20 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10"
                aria-label="Fermer la modale"
              >
                Fermer
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
