import NextAuth from "next-auth";

/**
 * Edge-safe auth instance — for middleware.ts only.
 *
 * middleware.ts runs in the Edge runtime, which Vercel caps at 1MB. Importing
 * the full instance from ./config pulls bcryptjs and the entire Prisma client
 * into that bundle and blows past the limit.
 *
 * Sessions are JWT, so deciding whether a request is authenticated needs only
 * AUTH_SECRET and the token callbacks — never a database round-trip. Actual
 * sign-in (bcrypt compare, user lookup, rate limiting) still happens in
 * ./config, which runs in the Node runtime via /api/auth/[...nextauth].
 *
 * The callbacks below must stay identical to the ones in ./config, or the role
 * that middleware reads will not match the one the app issues.
 */
export const { auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/admin/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role as "ADMIN" | "STAFF";
      session.user.id = token.id as string;
      return session;
    },
  },
});
