import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      isChiefDoctor: boolean;
      permRdv: boolean;
      permFile: boolean;
      permPaie: boolean;
      permPatAdm: boolean;
      permPatConst: boolean;
      permPatMed: boolean;
      permStats: boolean;
    };
  }

  interface User {
    role: Role;
    isChiefDoctor: boolean;
    permRdv: boolean;
    permFile: boolean;
    permPaie: boolean;
    permPatAdm: boolean;
    permPatConst: boolean;
    permPatMed: boolean;
    permStats: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    isChiefDoctor: boolean;
    permRdv: boolean;
    permFile: boolean;
    permPaie: boolean;
    permPatAdm: boolean;
    permPatConst: boolean;
    permPatMed: boolean;
    permStats: boolean;
  }
}
