"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type ConfirmSubmitButtonProps = {
  message: string;
  children: ReactNode;
  className?: string;
  confirmTitle?: string;
  confirmDescription?: string;
};

export function ConfirmSubmitButton({
  message,
  children,
  className,
  confirmTitle = "Confirmer l’action",
  confirmDescription,
}: ConfirmSubmitButtonProps) {
  const [open, setOpen] = useState(false);

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
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-cabinet-primary-dark/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-submit-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-lg border border-cabinet-border bg-cabinet-card p-5 shadow-[0_28px_90px_-44px_rgba(0,0,0,0.75)]">
            <p id="confirm-submit-title" className="font-heading text-xl font-semibold text-cabinet-primary-dark">
              {confirmTitle}
            </p>
            <p className="mt-3 text-sm leading-6 text-cabinet-muted">
              {confirmDescription ?? message}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" className="rounded-md border border-cabinet-border bg-white px-4 py-2 text-sm font-semibold text-cabinet-primary-dark shadow-sm transition hover:bg-cabinet-cream" onClick={() => setOpen(false)}>
                Annuler
              </button>
              <button type="submit" className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
