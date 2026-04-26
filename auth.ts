import NextAuth, { type User } from "next-auth";
import { compare } from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { usersAuthLogin } from "@/lib/data/users-select";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
     maxAge: 60 * 60 // 1 hour
  },
  jwt: {
  maxAge: 60 * 60,
},
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db
          .select(usersAuthLogin)
          .from(users)
          .where(eq(users.email, credentials.email.toString()))
          .limit(1);

        if (user.length === 0) return null;

        const isPasswordValid = await compare(
          credentials.password.toString(),
          user[0].password as string
        );

        if (!isPasswordValid) return null;

        return {
          id: user[0].id.toString(),
          email: user[0].email,
          name: user[0].name,
          role: user[0].role,
        } as User;
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
      }

      const uid = (token.sub as string | undefined) ?? (token.id as string | undefined);
      const role = token.role as string | undefined;

      let permissionCodes: string[] = [];
      if (uid !== undefined && role !== undefined && role !== null) {
        const { getEffectivePermissionCodesForUser } = await import(
          "@/lib/data/role-permissions-map"
        );
        permissionCodes = await getEffectivePermissionCodesForUser(uid, role);
      }
      token.permissionCodes = permissionCodes;

      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub as string,
          role: token.role,
          name: token.name,
          email: token.email,
          permissionCodes: (token.permissionCodes as string[] | undefined) ?? [],
        },
      };
    },
  },
});
