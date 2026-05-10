import { auth } from "@/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

import { requirePermission } from "@/lib/auth-check";
import { logAdminAction } from "@/lib/logger";

// GET — Lista todos os produtos (incluindo inativos) + categorias
export async function GET() {
  const session = await requirePermission("products");
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const products = await query(
    `SELECT p.id, p.title, p.description, p.price, p.image_url, p.in_game_command, p.active, p.featured,
            c.name as category_name, c.slug as category_slug
     FROM products p
     INNER JOIN categories c ON p.category_id = c.id
     ORDER BY p.active DESC, p.featured DESC, p.id DESC`
  );

  const categories = await query(
    "SELECT id, name, slug FROM categories ORDER BY sort_order ASC"
  );

  return Response.json({ products, categories });
}

// POST — Criar produto
export async function POST(request: Request) {
  const session = await requirePermission("products");
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const body = await request.json();
  const { title, description, price, image_url, in_game_command, category_id, active, featured } = body;

  if (!title || !price || !category_id) {
    return Response.json({ error: "Título, preço e categoria são obrigatórios." }, { status: 400 });
  }

  await query(
    `INSERT INTO products (title, description, price, image_url, in_game_command, category_id, active, featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description || null, price, image_url || null, in_game_command || null, category_id, active ? 1 : 0, featured ? 1 : 0]
  );

  await logAdminAction(session.user.email!, "CRIAR_PRODUTO", `Título: ${title}, Preço: ${price}`);

  return Response.json({ success: true });
}

// PUT — Atualizar produto
export async function PUT(request: Request) {
  const session = await requirePermission("products");
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const body = await request.json();
  const { id, title, description, price, image_url, in_game_command, category_id, active, featured } = body;

  if (!id) return Response.json({ error: "ID é obrigatório." }, { status: 400 });

  await query(
    `UPDATE products SET title = ?, description = ?, price = ?, image_url = ?, in_game_command = ?, category_id = ?, active = ?, featured = ?
     WHERE id = ?`,
    [title, description || null, price, image_url || null, in_game_command || null, category_id, active ? 1 : 0, featured ? 1 : 0, id]
  );

  await logAdminAction(session.user.email!, "EDITAR_PRODUTO", `ID: ${id}, Título: ${title}`);

  return Response.json({ success: true });
}

// DELETE — Desativar produto (soft delete)
export async function DELETE(request: Request) {
  const session = await requirePermission("products");
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const body = await request.json();
  const { id } = body;

  if (!id) return Response.json({ error: "ID é obrigatório." }, { status: 400 });

  await query("UPDATE products SET active = 0 WHERE id = ?", [id]);
  await logAdminAction(session.user.email!, "EXCLUIR_PRODUTO", `ID: ${id} desativado`);
  return Response.json({ success: true });
}
