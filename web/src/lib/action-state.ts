import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export type ActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

export const emptyActionState: ActionState = { ok: false };

export function isNextControlFlowError(error: unknown) {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest?: unknown }).digest)
      : "";

  return digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND");
}

export function toUserError(error: unknown) {
  if (isNextControlFlowError(error)) {
    throw error;
  }

  if (error instanceof ZodError) {
    return "Merci de vérifier les champs saisis.";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return "Cette information existe déjà.";
    if (error.code === "P2025") return "L'élément demandé est introuvable.";
    return "Une erreur de base de données est survenue. Veuillez réessayer.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Une erreur inattendue est survenue. Veuillez réessayer.";
}

export function actionError(error: unknown): ActionState {
  return { ok: false, error: toUserError(error) };
}

export function actionSuccess(message: string): ActionState {
  return { ok: true, message };
}
