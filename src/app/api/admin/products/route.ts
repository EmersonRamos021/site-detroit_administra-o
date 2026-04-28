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

// GET — Lista todos os produtos (incluindo inativos) + categorias
export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const products = await query(
    `SELECT p.id, p.title, p.description, p.price, p.image_url, p.active, p.featured,
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
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const body = await request.json();
  const { title, description, price, image_url, category_id, active, featured } = body;

  if (!title || !price || !category_id) {
    return Response.json({ error: "Título, preço e categoria são obrigatórios." }, { status: 400 });
  }

  await query(
    `INSERT INTO products (title, description, price, image_url, category_id, active, featured)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, description || null, price, image_url || null, category_id, active ? 1 : 0, featured ? 1 : 0]
  );

  return Response.json({ success: true });
}

// PUT — Atualizar produto
export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const body = await request.json();
  const { id, title, description, price, image_url, category_id, active, featured } = body;

  if (!id) return Response.json({ error: "ID é obrigatório." }, { status: 400 });

  await query(
    `UPDATE products SET title = ?, description = ?, price = ?, image_url = ?, category_id = ?, active = ?, featured = ?
     WHERE id = ?`,
    [title, description || null, price, image_url || null, category_id, active ? 1 : 0, featured ? 1 : 0, id]
  );

  return Response.json({ success: true });
}

// DELETE — Desativar produto (soft delete)
export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Não autorizado" }, { status: 403 });

  const body = await request.json();
  const { id } = body;

  if (!id) return Response.json({ error: "ID é obrigatório." }, { status: 400 });

  await query("UPDATE products SET active = 0 WHERE id = ?", [id]);
  return Response.json({ success: true });
}
