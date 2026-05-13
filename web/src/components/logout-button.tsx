"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({ inverse }: { inverse?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={
        inverse
          ? "w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
          : "rounded-xl border border-cabinet-border bg-white/90 px-4 py-2 text-sm font-medium text-cabinet-primary shadow-sm transition hover:border-cabinet-accent/60 hover:bg-cabinet-cream"
      }
    >
      Déconnexion
    </button>
  );
}
