import { prisma } from "./prisma";

export async function logAudit(
  userId: string | undefined,
  action: string,
  resource: string,
  meta?: Record<string, unknown>
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });
  } catch {
    // ne pas bloquer le flux métier si l’audit échoue
  }
}
