import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

interface DbAdmin {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  permissions: any;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const admins = await query<DbAdmin>(
            "SELECT id, email, password_hash, role, permissions FROM admins WHERE email = ?",
            [credentials.email as string]
          );

          if (admins.length === 0) return null;

          const admin = admins[0];
          const isValid = await bcrypt.compare(
            credentials.password as string,
            admin.password_hash
          );

          if (!isValid) return null;
          
          let parsedPermissions = [];
          if (admin.permissions) {
             parsedPermissions = typeof admin.permissions === 'string' ? JSON.parse(admin.permissions) : admin.permissions;
          }

          return {
            id: admin.id.toString(),
            email: admin.email,
            role: admin.role,
            permissions: parsedPermissions,
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
        token.role = (user as any).role || "staff";
        token.permissions = (user as any).permissions || [];
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[];
        session.user.email = token.email as string;
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
