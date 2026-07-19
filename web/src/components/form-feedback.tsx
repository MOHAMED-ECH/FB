"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/action-state";

export function FormFeedback({
  state,
  className,
  autoHideMs = 4500,
}: {
  state: ActionState;
  className?: string;
  autoHideMs?: number;
}) {
  const message = state.error || state.message;
  const feedbackKey = `${state.feedbackId ?? 0}:${state.ok}:${message ?? ""}`;
  const [dismissedKey, setDismissedKey] = useState("");
  const visible = Boolean(message) && dismissedKey !== feedbackKey;

  useEffect(() => {
    if (!message || autoHideMs <= 0) return;

    const timer = window.setTimeout(() => setDismissedKey(feedbackKey), autoHideMs);
    return () => window.clearTimeout(timer);
  }, [feedbackKey, message, autoHideMs]);

  if (!visible) return null;

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm font-semibold shadow-sm ${
        state.error
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      } ${className ?? ""}`}
      role={state.error ? "alert" : "status"}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={() => setDismissedKey(feedbackKey)}
        className="shrink-0 rounded-sm px-1 text-current opacity-70 transition hover:opacity-100"
        aria-label="Fermer la notification"
      >
        x
      </button>
    </div>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Traitement...",
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`${className} disabled:cursor-not-allowed disabled:opacity-55`}>
      {pending ? pendingLabel : children}
    </button>
  );
}
