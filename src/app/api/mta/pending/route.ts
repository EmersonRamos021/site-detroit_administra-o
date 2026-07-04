import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const SECRET_TOKEN = process.env.MTA_SECRET_TOKEN ?? "detroit_mta_token_999";

/**
 * GET /api/mta/pending
 * Retorna todos os pedidos pagos e pendentes de entrega in-game.
 * O servidor MTA chama esse endpoint periodicamente (a cada 1 min).
 *
 * Resposta:
 * [
 *   {
 *     "order_id": 70,
 *     "order_code": "DR-81817YY",
 *     "game_id": "Samurai021",
 *     "items": [
 *       { "command": "add_coins:{conta}:1000", "quantity": 1 }
 *     ]
 *   }
 * ]
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth || auth !== `Bearer ${SECRET_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Busca todos os pedidos pagos com game_id preenchido
    const orders = await query<any>(
      `SELECT o.id, o.code, o.game_id
       FROM orders o
       WHERE o.status = 'pago'
         AND o.game_id IS NOT NULL
         AND o.game_id != ''
       ORDER BY o.created_at ASC`
    );

    if (orders.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Para cada pedido, busca seus itens e os comandos dos produtos
    const result = [];

    for (const order of orders) {
      const items = await query<any>(
        `SELECT oi.quantity, p.in_game_command AS command
         FROM order_items oi
         INNER JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?
           AND p.in_game_command IS NOT NULL
           AND p.in_game_command != ''`,
        [order.id]
      );

      if (items.length > 0) {
        result.push({
          order_id: order.id,
          order_code: order.code,
          game_id: order.game_id,
          items: items.map((i: any) => ({
            command: i.command,
            quantity: i.quantity,
          })),
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[MTA Pending] Erro:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
