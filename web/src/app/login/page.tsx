"use client";

import Image from "next/image";
import { useState } from "react";

const specialties = [
  "Exploration EEG",
  "Consultation migraine",
  "Suivi neurologique",
  "Dossiers d’imagerie",
];

const careSignals = [
  { label: "Parcours patient", value: "fluide" },
  { label: "Données médicales", value: "confidentielles" },
  { label: "Coordination", value: "temps réel" },
];

function NeuroScene() {
  return (
    <div className="neuro-stage relative mx-auto aspect-square w-full max-w-[510px]">
      <div className="absolute inset-0 rounded-full border border-cabinet-accent/16 bg-cabinet-cream/5 shadow-[inset_0_0_110px_rgba(216,200,165,0.08)]" />
      <div className="absolute inset-[5%] overflow-hidden rounded-full border border-white/10 shadow-[0_28px_90px_-50px_rgba(216,200,165,0.9)]">
        <Image
          src="/neuro-brain-hero.png"
          alt="Visualisation 3D du cerveau"
          fill
          priority
          sizes="(max-width: 768px) 90vw, 510px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_35%,rgba(7,54,36,0.2)_72%,rgba(7,54,36,0.68)_100%)]" />
      </div>
      <div className="neuro-orbit neuro-orbit-a" />
      <div className="neuro-orbit neuro-orbit-b" />
      <div className="neuro-orbit neuro-orbit-c" />
      <svg className="absolute bottom-[13%] left-[12%] h-12 w-[76%] text-cabinet-accent/85 drop-shadow-[0_0_18px_rgba(216,200,165,0.4)]" viewBox="0 0 320 52" fill="none" aria-hidden>
        <path d="M0 27h34l9-19 18 37 13-24h31l9-13 16 25 12-18h35l8-10 13 29 11-17h36l8-11 16 30 12-18h39" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="absolute left-[12%] top-[25%] h-3 w-3 rounded-full bg-cabinet-accent shadow-[0_0_26px_rgba(216,200,165,0.9)]" />
      <div className="absolute right-[11%] top-[35%] h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_24px_rgba(255,255,255,0.85)]" />
      <div className="absolute bottom-[27%] left-[20%] h-2.5 w-2.5 rounded-full bg-cabinet-secondary shadow-[0_0_24px_rgba(182,165,127,0.9)]" />
      <div className="absolute bottom-[9%] right-[13%] rounded-md border border-white/12 bg-white/10 px-3 py-2 text-xs font-semibold text-white/86 backdrop-blur">
        Cartographie neuronale
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("medecin@cabinet.local");
  const [password, setPassword] = useState("");
  const [error] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("error")
      ? "Identifiants incorrects ou compte désactivé."
      : null;
  });

  return (
    <main className="min-h-full bg-cabinet-bg">
      <section className="relative overflow-hidden bg-cabinet-primary-dark text-white">
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(90deg,rgba(216,200,165,0.18)_1px,transparent_1px),linear-gradient(180deg,rgba(216,200,165,0.12)_1px,transparent_1px)] [background-size:42px_42px]" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-cabinet-bg to-transparent" aria-hidden />

        <div className="relative mx-auto grid min-h-[720px] max-w-7xl gap-10 px-6 py-7 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-14">
          <div className="flex flex-col justify-between">
            <header className="flex items-center gap-3">
              <div className="overflow-hidden rounded-full border border-cabinet-accent/50 bg-cabinet-cream p-1.5">
                <Image src="/logo.jpeg" alt="Cabinet FB" width={74} height={74} className="rounded-full" priority />
              </div>
              <div>
                <p className="font-heading text-2xl font-semibold sm:text-3xl">Cabinet FB</p>
                <p className="text-xs font-semibold uppercase text-cabinet-accent">Cabinet de neurologie</p>
              </div>
            </header>

            <div className="max-w-2xl py-12 lg:py-16">
              <p className="mb-5 inline-flex border-l-2 border-cabinet-secondary pl-3 text-sm font-semibold uppercase text-cabinet-accent">
                Neurologie clinique et suivi digital
              </p>
              <h1 className="font-heading text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Une expérience patient moderne, précise et profondément humaine.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-white/76 sm:text-lg">
                Le cabinet réunit consultation, agenda, salle d’attente, imagerie et traçabilité dans un espace fluide,
                conçu pour soutenir la décision médicale sans distraire le praticien.
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {specialties.map((item) => (
                  <span key={item} className="rounded-md border border-white/12 bg-white/8 px-3 py-2 text-xs font-semibold text-cabinet-accent">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 border-t border-white/10 pt-5 text-sm text-white/72 sm:grid-cols-3">
              {careSignals.map((signal) => (
                <p key={signal.label}>
                  <span className="block font-semibold text-cabinet-accent">{signal.label}</span>
                  {signal.value}
                </p>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-6 pb-14 lg:pb-0">
            <NeuroScene />
            <div className="mx-auto grid w-full max-w-xl gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-xs uppercase text-white/50">Spécialité</p>
                <p className="mt-1 font-heading text-xl font-semibold text-white">Neurologie</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-xs uppercase text-white/50">Vision</p>
                <p className="mt-1 font-heading text-xl font-semibold text-white">Précision</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-xs uppercase text-white/50">Accueil</p>
                <p className="mt-1 font-heading text-xl font-semibold text-white">Sérénité</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:px-10 lg:grid-cols-[1fr_430px] lg:px-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Dossier neurologique", "Notes cliniques, constantes, documents et historique consultables en quelques secondes."],
            ["Parcours cabinet", "Agenda, file d’attente et encaissements restent alignés avec le rythme de consultation."],
            ["Confidentialité", "Accès par rôle, journal d’audit et protection des documents médicaux sensibles."],
          ].map(([title, text]) => (
            <article key={title} className="rounded-lg border border-cabinet-border bg-cabinet-card p-5 shadow-[0_16px_45px_-34px_rgba(7,54,36,0.35)]">
              <div className="mb-4 h-9 w-9 rounded-md border border-cabinet-border bg-cabinet-cream text-cabinet-primary">
                <svg viewBox="0 0 36 36" fill="none" aria-hidden>
                  <path d="M10 19h16M18 11v16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  <rect x="7" y="7" width="22" height="22" rx="6" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h2 className="font-heading text-xl font-semibold text-cabinet-primary-dark">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-cabinet-muted">{text}</p>
            </article>
          ))}
        </div>

        <div className="rounded-lg border border-cabinet-border bg-cabinet-card p-6 shadow-[0_18px_55px_-36px_rgba(15,90,63,0.55)]">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase text-cabinet-accent-dark">Connexion équipe</p>
            <h2 className="mt-2 font-heading text-3xl font-semibold text-cabinet-primary-dark">Espace sécurisé</h2>
            <p className="mt-2 text-sm leading-6 text-cabinet-muted">
              Accès réservé au personnel du cabinet.
            </p>
          </div>

          <form action="/api/local-login" method="post" className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-cabinet-primary-dark">
                Email
              </label>
              <input
                name="email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-cabinet-border bg-white px-4 py-3 text-sm text-cabinet-text outline-none transition focus:border-cabinet-primary focus:ring-2 focus:ring-cabinet-primary/15"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-cabinet-primary-dark">
                Mot de passe
              </label>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-cabinet-border bg-white px-4 py-3 text-sm text-cabinet-text outline-none transition focus:border-cabinet-primary focus:ring-2 focus:ring-cabinet-primary/15"
                required
              />
            </div>
            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
            )}
            <button
              type="submit"
              className="w-full rounded-md bg-cabinet-primary px-4 py-3.5 text-sm font-semibold text-white shadow-[0_14px_28px_-18px_rgba(7,54,36,0.75)] transition hover:bg-cabinet-primary-dark disabled:opacity-55"
            >
              Entrer dans l’espace cabinet
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
