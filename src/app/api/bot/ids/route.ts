import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const BOT_TOKEN = "detroit_mta_token_999";

// GET — Rota para o bot Discord consultar IDs in-game ocupados
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${BOT_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ids = await query("SELECT game_id, status FROM game_ids ORDER BY game_id ASC");
    return NextResponse.json({ ids });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
