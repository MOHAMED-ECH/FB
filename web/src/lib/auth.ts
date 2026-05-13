import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";
import { logAudit } from "./audit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
        });
        if (!user?.active) return null;
        const ok = await verifyPassword(credentials.password, user.passwordHash);
        if (!ok) return null;
        await logAudit(user.id, "LOGIN", "User", { email: user.email });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permRdv: user.permRdv,
          permFile: user.permFile,
          permPaie: user.permPaie,
          permPatAdm: user.permPatAdm,
          permPatConst: user.permPatConst,
          permPatMed: user.permPatMed,
          permStats: user.permStats,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.permRdv = user.permRdv;
        token.permFile = user.permFile;
        token.permPaie = user.permPaie;
        token.permPatAdm = user.permPatAdm;
        token.permPatConst = user.permPatConst;
        token.permPatMed = user.permPatMed;
        token.permStats = user.permStats;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role;
        session.user.permRdv = token.permRdv;
        session.user.permFile = token.permFile;
        session.user.permPaie = token.permPaie;
        session.user.permPatAdm = token.permPatAdm;
        session.user.permPatConst = token.permPatConst;
        session.user.permPatMed = token.permPatMed;
        session.user.permStats = token.permStats;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
