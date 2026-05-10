import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const SECRET_TOKEN = "detroit_mta_token_999";

export async function POST(req: Request) {
  // Verificar autenticação
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${SECRET_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    // Atualiza o status para 'entregue'
    const result = await query<any>(
      "UPDATE orders SET status = 'entregue', updated_at = NOW() WHERE id = ? AND status = 'pago'",
      [order_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Pedido não encontrado ou já entregue" }, { status: 404 });
    }

    console.log(`✅ [MTA] Pedido #${order_id} marcado como ENTREGUE com sucesso!`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao confirmar entrega:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
