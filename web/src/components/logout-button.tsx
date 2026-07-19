"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

const LOGOUT_CONFIRM_EVENT = "cabinet:logout-confirm";

export function LogoutButton({
  inverse,
  compact,
}: {
  inverse?: boolean;
  compact?: boolean;
}) {
  const buttonClass = inverse
    ? compact
      ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white shadow-sm transition hover:border-cabinet-accent/70 hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-cabinet-accent/70"
      : "w-full rounded-md border border-white/20 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/14"
    : "rounded-md border border-cabinet-border bg-white px-4 py-2 text-sm font-semibold text-cabinet-primary-dark shadow-sm transition hover:border-cabinet-secondary hover:bg-cabinet-cream";

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(LOGOUT_CONFIRM_EVENT))}
      className={buttonClass}
      aria-label="Déconnexion"
      title="Déconnexion"
    >
      {compact ? (
        <>
          <LogoutIcon />
          <span className="sr-only">Déconnexion</span>
        </>
      ) : (
        "Déconnexion"
      )}
    </button>
  );
}

export function LogoutConfirmDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openDialog = () => setOpen(true);

    window.addEventListener(LOGOUT_CONFIRM_EVENT, openDialog);
    return () => window.removeEventListener(LOGOUT_CONFIRM_EVENT, openDialog);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-cabinet-primary-dark/78 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setOpen(false);
        }
      }}
    >
      <div className="relative w-full max-w-md rounded-lg border border-cabinet-border bg-cabinet-card p-6 shadow-[0_34px_110px_-40px_rgba(7,54,36,0.92)]">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-cabinet-border bg-white text-cabinet-muted transition hover:bg-cabinet-cream hover:text-cabinet-primary-dark"
          aria-label="Fermer"
          title="Fermer"
        >
          <CloseIcon />
        </button>
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md border border-cabinet-border bg-cabinet-cream text-cabinet-primary-dark">
          <LogoutIcon />
        </div>
        <p className="text-xs font-semibold uppercase text-cabinet-accent-dark">Session cabinet</p>
        <h2 id="logout-confirm-title" className="mt-2 pr-10 font-heading text-2xl font-semibold text-cabinet-primary-dark">
          Confirmer la déconnexion
        </h2>
        <p className="mt-3 text-sm leading-6 text-cabinet-muted">
          Vous allez quitter votre espace sécurisé. Vous devrez vous reconnecter pour accéder aux dossiers du cabinet.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md border border-cabinet-border bg-white px-4 py-2 text-sm font-semibold text-cabinet-primary-dark transition hover:bg-cabinet-cream"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md bg-cabinet-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-cabinet-primary-dark"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 7V5.8C10 4.8 10.8 4 11.8 4H17c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2h-5.2c-1 0-1.8-.8-1.8-1.8V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M14 12H4m0 0 3-3m-3 3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
