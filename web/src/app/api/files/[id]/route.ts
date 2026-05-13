import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Non autorisé", { status: 401 });
  const can = session.user.role === "DOCTOR" || session.user.permPatMed;
  if (!can) return new NextResponse("Interdit", { status: 403 });

  const { id } = await context.params;
  const doc = await prisma.medicalDocument.findUnique({
    where: { id },
    include: { medical: true },
  });
  if (!doc) return new NextResponse("Introuvable", { status: 404 });

  const abs = path.join(/* turbopackIgnore: true */ process.cwd(), doc.filePath);
  const buf = await readFile(abs);
  const ext = path.extname(doc.fileName).toLowerCase();
  const mime =
    ext === ".pdf"
      ? "application/pdf"
      : ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : "application/octet-stream";

  return new NextResponse(buf, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
    },
  });
}
