import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const BOT_TOKEN = "detroit_mta_token_999";

// GET — Rota para o bot Discord consultar pedidos da loja
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${BOT_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "10")));
  const statusFilter = url.searchParams.get("status") || "todos";
  const offset = (page - 1) * limit;

  try {
    let whereClause = "";
    const whereParams: any[] = [];

    if (statusFilter !== "todos") {
      whereClause = "WHERE o.status = ?";
      whereParams.push(statusFilter);
    }

    // Total
    const countResult = await query<{ total: number }>(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      whereParams
    );
    const total = Number(countResult[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Pedidos paginados com produto
    const orders = await query<any>(
      `SELECT 
        o.id, o.code, o.status, o.price, o.game_id, o.created_at, o.full_name,
        u.discord_tag, u.discord_id,
        GROUP_CONCAT(p.title SEPARATOR ', ') as product_title
       FROM orders o
       INNER JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON oi.product_id = p.id
       ${whereClause}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset]
    );

    return NextResponse.json({ orders, total, totalPages, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
