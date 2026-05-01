import { auth } from "@/auth";
import { query } from "@/lib/db";
import { sendStatusUpdateNotification } from "@/lib/discord";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.discord_id || session.user.role !== "admin") {
    return null;
  }
  return session;
}

// GET — Lista todos os pedidos (admin) com paginação e filtro
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const statusFilter = searchParams.get("status") || "todos";
  const offset = (page - 1) * limit;

  // Monta cláusula WHERE
  const whereClause = statusFilter !== "todos" ? "WHERE o.status = ?" : "";
  const whereParams: string[] = statusFilter !== "todos" ? [statusFilter] : [];

  // Conta total de pedidos (com filtro)
  // MySQL2 retorna COUNT como BigInt — usar Number() para converter
  const countResult = await query<{ total: string | number | bigint }>(
    `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
    whereParams
  );
  const total = Number(countResult[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Busca pedidos paginados — LIMIT/OFFSET devem ser inteiros
  const orders = await query(
    `SELECT o.id, o.code, o.status, o.price, o.created_at, o.updated_at, o.mp_payment_id,
            p.title as product_title, p.image_url as product_image,
            u.discord_tag as user_tag, u.discord_id as user_discord_id
     FROM orders o
     INNER JOIN products p ON o.product_id = p.id
     INNER JOIN users u ON o.user_id = u.id
     ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    whereParams
  );

  return Response.json({ orders, total, page, totalPages, limit });
}

// PATCH — Atualizar status do pedido
export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const body = await request.json();
  const { id, status } = body;

  const validStatuses = ["pendente", "pago", "entregue", "cancelado"];
  if (!id || !validStatuses.includes(status)) {
    return Response.json({ error: "ID e status válido são obrigatórios." }, { status: 400 });
  }

  await query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

  // Buscar dados do pedido para notificação
  try {
    const orders = await query<{
      code: string;
      price: number;
      product_title: string;
      user_discord_id: string;
    }>(
      `SELECT o.code, o.price, p.title as product_title, u.discord_id as user_discord_id
       FROM orders o
       INNER JOIN products p ON o.product_id = p.id
       INNER JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [id]
    );

    if (orders.length > 0) {
      const order = orders[0];
      sendStatusUpdateNotification({
        code: order.code,
        productTitle: order.product_title,
        userDiscordId: order.user_discord_id,
        newStatus: status,
        price: Number(order.price),
      });
    }
  } catch {
    // Notificação é fire-and-forget, não quebra a atualização
  }

  return Response.json({ success: true });
}

