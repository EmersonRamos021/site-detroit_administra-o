import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

const SECRET_TOKEN = process.env.MTA_SECRET_TOKEN ?? "detroit_mta_token_999";

/**
 * POST /api/mta/confirm
 * O servidor MTA chama esse endpoint após entregar um pedido in-game.
 * Muda o status do pedido de 'pago' para 'entregue'.
 *
 * Body: { "order_id": 70 }
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth || auth !== `Bearer ${SECRET_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const { order_id } = body;
    if (!order_id || typeof order_id !== "number") {
      return NextResponse.json({ error: "order_id inválido" }, { status: 400 });
    }

    const pool = getPool();
    const [result]: any = await pool.execute(
      `UPDATE orders
       SET status = 'entregue', updated_at = NOW()
       WHERE id = ? AND status = 'pago'`,
      [order_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Pedido não encontrado ou já marcado como entregue" },
        { status: 404 }
      );
    }

    console.log(`[MTA] ✅ Pedido #${order_id} marcado como ENTREGUE.`);
    return NextResponse.json({ success: true, order_id });
  } catch (error) {
    console.error("[MTA Confirm] Erro:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
