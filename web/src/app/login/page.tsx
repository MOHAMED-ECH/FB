"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("medecin@cabinet.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Identifiants incorrects ou compte désactivé.");
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden lg:flex-row">
      <div className="relative flex flex-1 flex-col justify-center px-6 py-16 sm:px-12 lg:px-16 lg:py-24">
        <div
          className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-cabinet-primary/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cabinet-accent/40 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10 max-w-lg">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.25em] text-cabinet-accent-dark">
            Cabinet de neurologie
          </p>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight tracking-tight text-cabinet-primary sm:text-5xl">
            Un espace de travail digne de votre expertise.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-cabinet-muted">
            Agenda, dossiers patients, salle d’attente et suivi financier — tout réuni dans une interface pensée pour le
            cabinet FB.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-cabinet-text/90">
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cabinet-primary/10 text-xs font-bold text-cabinet-primary">
                ✓
              </span>
              Séparation stricte secrétaire / données médicales
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cabinet-primary/10 text-xs font-bold text-cabinet-primary">
                ✓
              </span>
              Parcours consultation → prochain rendez-vous
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cabinet-primary/10 text-xs font-bold text-cabinet-primary">
                ✓
              </span>
              Statistiques et journal d’audit
            </li>
          </ul>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center bg-gradient-to-br from-cabinet-primary via-cabinet-primary-dark to-[#071912] px-6 py-16 lg:px-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="relative z-10 w-full max-w-md">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-1 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            <div className="rounded-[1.35rem] bg-white/95 p-8 shadow-inner sm:p-10">
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-cabinet-accent to-cabinet-secondary opacity-70 blur-md" />
                  <Image
                    src="/logo.jpeg"
                    alt="Cabinet FB"
                    width={100}
                    height={100}
                    className="relative rounded-full ring-4 ring-white shadow-lg"
                    priority
                  />
                </div>
                <h2 className="font-heading text-2xl font-semibold text-cabinet-primary">Connexion</h2>
                <p className="mt-2 text-sm text-cabinet-muted">Espace réservé au personnel du cabinet</p>
              </div>
              <form onSubmit={onSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
                    Email
                  </label>
                  <input
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-cabinet-border bg-cabinet-cream/80 px-4 py-3 text-sm text-cabinet-text outline-none ring-cabinet-primary/20 transition focus:ring-4"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cabinet-primary/80">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-cabinet-border bg-cabinet-cream/80 px-4 py-3 text-sm text-cabinet-text outline-none ring-cabinet-primary/20 transition focus:ring-4"
                    required
                  />
                </div>
                {error && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-cabinet-primary to-cabinet-primary-dark py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_-8px_rgba(26,77,51,0.55)] transition hover:brightness-110 disabled:opacity-55"
                >
                  {loading ? "Connexion…" : "Entrer dans l’application"}
                </button>
              </form>
              <p className="mt-8 text-center text-xs leading-relaxed text-cabinet-muted">
                Données de démonstration : lancez{" "}
                <code className="rounded-md bg-cabinet-bg px-1.5 py-0.5 font-mono text-[11px] text-cabinet-primary">
                  npm run db:seed
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
