import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/authorization";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const inlineMimeByExtension: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".txt": "text/plain; charset=utf-8",
  ".text": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function fileErrorResponse(message: string, status: number) {
  return new NextResponse(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Document indisponible</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f2ea;color:#173f2b;font-family:system-ui,sans-serif}.card{max-width:560px;margin:24px;padding:28px;border:1px solid #d8c8a5;border-radius:12px;background:#fffdf8;box-shadow:0 24px 70px rgba(7,54,36,.14)}p{color:#66736c;line-height:1.6}a{display:inline-flex;margin-top:12px;border-radius:8px;background:#236245;color:#fff;text-decoration:none;padding:11px 18px;font-weight:700}</style></head><body><main class="card"><h1>Document indisponible</h1><p>${message}</p><a href="/dashboard">Retour au tableau de bord</a></main></body></html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    }
  );
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return fileErrorResponse("Votre session a expiré. Veuillez vous reconnecter.", 401);
  if (!hasPermission(user, "permPatMed")) {
    return fileErrorResponse("Vous n'avez pas le droit d'ouvrir ce document médical.", 403);
  }

  const { id } = await context.params;
  const doc = await prisma.medicalDocument.findUnique({
    where: { id },
    include: { medical: true },
  });
  if (!doc) return fileErrorResponse("Ce document est introuvable dans le dossier médical.", 404);

  const uploadRoot = path.join(/* turbopackIgnore: true */ process.cwd(), "storage", "uploads");
  const abs = path.resolve(/* turbopackIgnore: true */ process.cwd(), doc.filePath);
  const relative = path.relative(uploadRoot, abs);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return fileErrorResponse("Le chemin du document est invalide.", 400);
  }

  let buf: Buffer;
  try {
    buf = await readFile(abs);
  } catch {
    return fileErrorResponse("Le fichier n'est plus disponible sur le serveur.", 404);
  }
  const ext = path.extname(doc.filePath).toLowerCase();
  const mime = inlineMimeByExtension[ext] ?? "application/octet-stream";
  const body = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;

  await logAudit(user.id, "OPEN_MEDICAL_DOCUMENT", "MedicalDocument", {
    documentId: doc.id,
    patientId: doc.medical.patientId,
    fileName: doc.fileName,
  });

  return new NextResponse(body, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": "inline",
      "Content-Length": String(buf.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
