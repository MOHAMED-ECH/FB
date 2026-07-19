import type { User } from "@prisma/client";

export const permissionFields = [
  "permRdv",
  "permFile",
  "permPaie",
  "permPatAdm",
  "permPatConst",
  "permPatMed",
  "permStats",
] as const;

export const sessionMaxAgeSeconds = Number(process.env.SESSION_MAX_AGE_SECONDS ?? 8 * 60 * 60);

type AuthPayloadUser = Pick<
  User,
  | "id"
  | "email"
  | "name"
  | "role"
  | "isChiefDoctor"
  | (typeof permissionFields)[number]
>;

export function authPayloadFromUser(user: AuthPayloadUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isChiefDoctor: user.isChiefDoctor,
    permRdv: user.permRdv,
    permFile: user.permFile,
    permPaie: user.permPaie,
    permPatAdm: user.permPatAdm,
    permPatConst: user.permPatConst,
    permPatMed: user.permPatMed,
    permStats: user.permStats,
  };
}
