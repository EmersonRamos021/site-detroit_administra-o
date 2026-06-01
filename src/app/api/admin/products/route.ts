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

// DELETE — Desativar produto (soft delete) ou Excluir permanente
export async function DELETE(request: Request) {
  const session = await requirePermission("products");
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const body = await request.json();
  const { id, hardDelete } = body;

  if (!id) return Response.json({ error: "ID é obrigatório." }, { status: 400 });

  if (hardDelete) {
    try {
      await query("DELETE FROM products WHERE id = ?", [id]);
      await logAdminAction(session.user.email!, "EXCLUIR_PRODUTO", `ID: ${id} deletado permanentemente`);
      return Response.json({ success: true });
    } catch (error: any) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
        return Response.json({ error: "Este produto não pode ser excluído permanentemente porque já possui pedidos associados no banco de dados. Ele deve apenas permanecer inativo." }, { status: 400 });
      }
      return Response.json({ error: "Erro ao excluir produto do banco de dados." }, { status: 500 });
    }
  } else {
    await query("UPDATE products SET active = 0 WHERE id = ?", [id]);
    await logAdminAction(session.user.email!, "DESATIVAR_PRODUTO", `ID: ${id} desativado`);
    return Response.json({ success: true });
  }
}
