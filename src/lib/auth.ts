import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";

const envAllowedEmails = new Set(
  (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      if (envAllowedEmails.has(email)) return true;

      const dbEntry = await prisma.allowedEmail.findUnique({ where: { email } });
      if (dbEntry) return true;

      // Nothing configured anywhere yet (fresh setup) -> allow so the first
      // admin isn't locked out before adding anyone.
      if (envAllowedEmails.size === 0) {
        const anyConfigured = await prisma.allowedEmail.count();
        if (anyConfigured === 0) return true;
      }

      return false;
    },
  },
});
