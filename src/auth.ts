import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

interface DbAdmin {
  id: number;
  username: string;
  password_hash: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        try {
          const admins = await query<DbAdmin>(
            "SELECT id, username, password_hash FROM admins WHERE username = ?",
            [credentials.username as string]
          );

          if (admins.length === 0) return null;

          const admin = admins[0];
          const isValid = await bcrypt.compare(
            credentials.password as string,
            admin.password_hash
          );

          if (!isValid) return null;

          return {
            id: admin.id.toString(),
            name: admin.username,
            role: "admin",
          };
        } catch (error) {
          console.error("Erro na autorização:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        // Mocking para n quebrar types legados
        (session.user as any).discord_id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
