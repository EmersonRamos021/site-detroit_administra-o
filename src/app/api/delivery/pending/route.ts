import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const SECRET_TOKEN = "detroit_mta_token_999";

export async function GET(req: Request) {
  // Verificar autenticação
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${SECRET_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Buscar pedidos com status 'pago' que ainda não foram entregues in-game
    // Como a loja atualiza o status para 'pago' ao confirmar o PIX
    const orders = await query<any>(
      `SELECT id, code, game_id, status 
       FROM orders 
       WHERE status = 'pago' AND game_id IS NOT NULL`
    );

    if (orders.length === 0) {
      return NextResponse.json([]);
    }

    // Buscar os itens de cada pedido
    const pendingDeliveries = [];

    for (const order of orders) {
      const items = await query<any>(
        `SELECT oi.quantity, p.in_game_command 
         FROM order_items oi
         INNER JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ? AND p.in_game_command IS NOT NULL AND p.in_game_command != ''`,
        [order.id]
      );

      if (items.length > 0) {
        pendingDeliveries.push({
          order_id: order.id,
          order_code: order.code,
          game_id: order.game_id,
          items: items.map((i: any) => ({
            command: i.in_game_command,
            quantity: i.quantity
          }))
        });
      }
    }

    return NextResponse.json(pendingDeliveries);
  } catch (error) {
    console.error("Erro ao buscar entregas pendentes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
