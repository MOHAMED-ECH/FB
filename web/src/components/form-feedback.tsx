"use client";

import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/action-state";

export function FormFeedback({ state }: { state: ActionState }) {
  const message = state.error || state.message;
  if (!message) return null;

  return (
    <p
      className={`rounded-md border px-4 py-3 text-sm font-semibold ${
        state.error
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
      role={state.error ? "alert" : "status"}
    >
      {message}
    </p>
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
