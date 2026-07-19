import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authPayloadFromUser, permissionFields, sessionMaxAgeSeconds } from "./auth-payload";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";
import { logAudit } from "./audit";
import {
  assertLoginAllowed,
  loginClientIp,
  recordLoginFailure,
  resetLoginFailures,
} from "./login-attempts";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const ip = loginClientIp(request);
        await assertLoginAllowed(email, ip);

        const fail = async () => {
          await recordLoginFailure(email, ip);
          return null;
        };

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.active) return fail();
        const ok = await verifyPassword(credentials.password, user.passwordHash);
        if (!ok) return fail();
        await resetLoginFailures(email, ip);
        await logAudit(user.id, "LOGIN", "User", { email: user.email });
        return authPayloadFromUser(user);
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.isChiefDoctor = user.isChiefDoctor;
        for (const field of permissionFields) token[field] = user[field];
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role;
        session.user.isChiefDoctor = token.isChiefDoctor;
        for (const field of permissionFields) session.user[field] = token[field];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: sessionMaxAgeSeconds,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
