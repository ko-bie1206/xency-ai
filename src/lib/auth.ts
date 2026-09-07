import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedEmails = new Set(
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
    signIn({ user }) {
      if (allowedEmails.size === 0) return true;
      const email = user.email?.toLowerCase();
      return !!email && allowedEmails.has(email);
    },
  },
});
