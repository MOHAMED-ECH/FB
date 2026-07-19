import { prisma } from "./prisma";

const MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS ?? 5);
const WINDOW_MS = Number(process.env.LOGIN_ATTEMPT_WINDOW_SECONDS ?? 15 * 60) * 1000;
const LOCK_MS = Number(process.env.LOGIN_LOCK_SECONDS ?? 15 * 60) * 1000;

function attemptKey(email: string, ip: string) {
  return `${email}:${ip}`;
}

function headerValue(headers: unknown, name: string) {
  if (!headers) return undefined;
  if (headers instanceof Headers) return headers.get(name) ?? undefined;
  const record = headers as Record<string, string | string[] | undefined>;
  const value = record[name] ?? record[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

export function loginClientIp(request: { headers?: unknown } | undefined) {
  const forwarded = headerValue(request?.headers, "x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headerValue(request?.headers, "x-real-ip") ?? "unknown";
}

export async function assertLoginAllowed(email: string, ip: string) {
  const attempt = await prisma.loginAttempt.findUnique({
    where: { key: attemptKey(email, ip) },
  });
  if (!attempt?.lockedUntil) return;
  if (attempt.lockedUntil > new Date()) {
    throw new Error("Trop de tentatives. Reessayez plus tard.");
  }
}

export async function recordLoginFailure(email: string, ip: string) {
  const key = attemptKey(email, ip);
  const now = new Date();
  const existing = await prisma.loginAttempt.findUnique({ where: { key } });
  const withinWindow = existing ? now.getTime() - existing.lastAttempt.getTime() <= WINDOW_MS : false;
  const attempts = existing && withinWindow ? existing.attempts + 1 : 1;
  const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + LOCK_MS) : null;

  await prisma.loginAttempt.upsert({
    where: { key },
    create: { key, email, ip, attempts, lastAttempt: now, lockedUntil },
    update: { attempts, lastAttempt: now, lockedUntil },
  });
}

export async function resetLoginFailures(email: string, ip: string) {
  await prisma.loginAttempt.deleteMany({
    where: { key: attemptKey(email, ip) },
  });
}
