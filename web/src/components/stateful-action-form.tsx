"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { emptyActionState } from "@/lib/action-state";
import { FormFeedback } from "@/components/form-feedback";

export function StatefulActionForm({
  action,
  className,
  children,
}: {
  action: (previousState: ActionState, formData: FormData) => Promise<ActionState>;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, emptyActionState);

  return (
    <form action={formAction} className={className}>
      {children}
      <FormFeedback state={state} />
    </form>
  );
}
