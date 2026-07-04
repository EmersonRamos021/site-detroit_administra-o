import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

const SECRET_TOKEN = process.env.MTA_SECRET_TOKEN ?? "detroit_mta_token_999";

/**
 * POST /api/mta/cleanup
 * Marca todos os pedidos de teste (game_id numérico 1-10) como entregues
 * para limpar a fila de pedidos antigos de teste.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth || auth !== `Bearer ${SECRET_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pool = getPool();
    const [result]: any = await pool.execute(
      `UPDATE orders SET status = 'entregue', updated_at = NOW()
       WHERE status = 'pago'
         AND (game_id IN ('2', '3', '4', '5', '6', '7', '8', '9', '10'))`
    );

    return NextResponse.json({
      success: true,
      cleaned: result.affectedRows,
      message: `${result.affectedRows} pedidos de teste marcados como entregues.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
