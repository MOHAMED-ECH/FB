"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { emptyActionState } from "@/lib/action-state";
import { FormFeedback } from "@/components/form-feedback";

export function StatefulActionForm({
  action,
  className,
  children,
  feedback = "inline",
}: {
  action: (previousState: ActionState, formData: FormData) => Promise<ActionState>;
  className?: string;
  children: React.ReactNode;
  feedback?: "inline" | "toast" | "none";
}) {
  const [state, formAction] = useActionState(action, emptyActionState);

  return (
    <form action={formAction} className={className}>
      {children}
      {feedback === "inline" && <FormFeedback state={state} />}
      {feedback === "toast" && (
        <FormFeedback
          state={state}
          className="fixed bottom-5 right-5 z-[140] w-[min(420px,calc(100vw-2.5rem))]"
        />
      )}
    </form>
  );
}
