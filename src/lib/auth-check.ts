import { auth } from "@/auth";
import { query } from "@/lib/db";

export async function requirePermission(permission: string) {
  const session = await auth();
  if (!session?.user?.email) return null;
  
  // VALIDAÇÃO DE SEGURANÇA FORÇADA: 
  // Verifica no Banco de Dados se a pessoa AINDA existe e AINDA tem os acessos
  try {
    const dbCheck = await query<{role: string, permissions: string}>("SELECT role, permissions FROM admins WHERE email = ?", [session.user.email]);
    if (dbCheck.length === 0) return null; // Conta foi deletada, derruba na hora!
    
    // Atualiza a sessão em tempo real com o banco
    const admin = dbCheck[0];
    session.user.role = admin.role;
    session.user.permissions = typeof admin.permissions === 'string' ? JSON.parse(admin.permissions) : (admin.permissions || []);
  } catch (e) {
    return null;
  }

  if (session.user.role === 'superadmin') {
    return session;
  }
  
  const perms = session.user.permissions || [];
  if (perms.includes(permission) || perms.includes("all")) {
    return session;
  }
  
  return null;
}
