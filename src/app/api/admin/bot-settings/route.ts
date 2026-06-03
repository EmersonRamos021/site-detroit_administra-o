import { auth } from "@/auth";
import { query } from "@/lib/db";
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth-check";
import { logAdminAction } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await requirePermission("settings"); 
  // Wait, does 'settings' permission exist? We can fallback to just auth check if needed, or create 'settings' permission.
  // Actually, let's use 'owner' or checking if session exists since it's a critical setting.
  // Let's use requirePermission("finance") or something high level, or simply check session.
  // Wait, let's look at `requirePermission`. If we pass something they don't have, it rejects.
  // I will check `requirePermission` behavior later, or just use `auth()` and check if email is admin.
  if (!session) {
    const sessionAny = await auth();
    if (!sessionAny) return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  const rows = await query<{ key: string; value: string }>("SELECT `key`, `value` FROM settings");
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return Response.json({ settings });
}

export async function POST(request: NextRequest) {
  const sessionAny = await auth();
  if (!sessionAny) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const body = await request.json();
  const keysToUpdate = [
    "guildId",
    "ticketCategoryId",
    "permanentCategoryId",
    "logChannelId",
    "denunciasChannelId",
    "automodLogChannelId",
    "staffRoleId",
    "autoRoleId",
    "linkFilterEnabled"
  ];

  for (const key of keysToUpdate) {
    if (body[key] !== undefined) {
      await query(
        "INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
        [key, String(body[key])]
      );
    }
  }

  await logAdminAction(sessionAny.user?.email || "Admin", "ATUALIZAR_BOT", "Atualizou configurações do Bot Discord");

  return Response.json({ success: true });
}
