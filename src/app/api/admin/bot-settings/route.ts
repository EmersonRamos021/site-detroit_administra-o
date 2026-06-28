import { auth } from "@/auth";
import { query } from "@/lib/db";
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth-check";
import { logAdminAction } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await requirePermission("settings"); 
  if (!session) {
    return Response.json({ error: "Não autorizado" }, { status: 403 });
  }

  const rows = await query<{ key: string; value: string }>("SELECT `key`, `value` FROM settings");
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return Response.json({ settings });
}

export async function POST(request: NextRequest) {
  const session = await requirePermission("settings");
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const body = await request.json();
  const keysToUpdate = [
    "guildId",
    "ticketCategoryId",
    "ticketCategoryCompras",
    "ticketCategorySuporte",
    "ticketCategoryDenuncia",
    "ticketCategoryRevisao",
    "permanentCategoryId",
    "logChannelId",
    "denunciasChannelId",
    "automodLogChannelId",
    "staffRoleId",
    "autoRoleId",
    "linkFilterEnabled",
    "memberCounterChannelId",
    "badWords_list",
    "antiFlood_maxMessages",
    "antiFlood_timeWindow",
    "mtaServerIp",
    "mtaServerPort",
    "mtaSocialStore",
    "mtaSocialInsta",
    "mtaSocialTiktok",
    "mtaSocialYoutube",
    "botAvatarUrl"
  ];

  for (const key of keysToUpdate) {
    if (body[key] !== undefined) {
      await query(
        "INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
        [key, String(body[key])]
      );
    }
  }

  await logAdminAction(session.user?.email || "Admin", "ATUALIZAR_BOT", "Atualizou configurações do Bot Discord");

  return Response.json({ success: true });
}
