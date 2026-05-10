import { auth } from "@/auth";

export async function requirePermission(permission: string) {
  const session = await auth();
  if (!session?.user?.email) return null;
  
  if (session.user.role === 'superadmin') {
    return session;
  }
  
  const perms = session.user.permissions || [];
  if (perms.includes(permission) || perms.includes("all")) {
    return session;
  }
  
  return null;
}
