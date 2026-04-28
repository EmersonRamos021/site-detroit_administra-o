import { auth } from "@/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.discord_id || session.user.role !== "admin") {
    return null;
  }
  return session;
}

// GET — Lista todos os cupons
export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const coupons = await query(
    `SELECT id, code, discount_type, discount_value, min_price, max_uses, used_count, active, expires_at, created_at
     FROM coupons
     ORDER BY created_at DESC`
  );

  return Response.json({ coupons });
}

// POST — Criar cupom
export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const body = await request.json();
  const { code, discount_type, discount_value, min_price, max_uses, active, expires_at } = body;

  if (!code || !discount_type || discount_value === undefined) {
    return Response.json({ error: "Código e valor de desconto são obrigatórios." }, { status: 400 });
  }

  // Verifica se o cupom já existe
  const existing = await query("SELECT id FROM coupons WHERE code = ?", [code]);
  if (existing.length > 0) {
    return Response.json({ error: "Um cupom com este código já existe." }, { status: 400 });
  }

  await query(
    `INSERT INTO coupons (code, discount_type, discount_value, min_price, max_uses, active, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      code,
      discount_type,
      discount_value,
      min_price || 0,
      max_uses || null,
      active ? 1 : 0,
      expires_at || null
    ]
  );

  return Response.json({ success: true });
}

// PUT — Atualizar cupom
export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const body = await request.json();
  const { id, code, discount_type, discount_value, min_price, max_uses, active, expires_at } = body;

  if (!id || !code) return Response.json({ error: "ID e Código são obrigatórios." }, { status: 400 });

  await query(
    `UPDATE coupons SET code = ?, discount_type = ?, discount_value = ?, min_price = ?, max_uses = ?, active = ?, expires_at = ?
     WHERE id = ?`,
    [
      code,
      discount_type,
      discount_value,
      min_price || 0,
      max_uses || null,
      active ? 1 : 0,
      expires_at || null,
      id
    ]
  );

  return Response.json({ success: true });
}

// DELETE — Deletar cupom
export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const body = await request.json();
  const { id } = body;

  if (!id) return Response.json({ error: "ID é obrigatório." }, { status: 400 });

  await query("DELETE FROM coupons WHERE id = ?", [id]);
  return Response.json({ success: true });
}
