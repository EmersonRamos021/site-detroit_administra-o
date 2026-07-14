import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePermission } from "@/lib/auth-check";
import { logAdminAction } from "@/lib/logger";

export async function GET() {
  try {
    const rules = await query(`SELECT * FROM rules ORDER BY order_index ASC`);
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Erro ao buscar regras:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionError = await requirePermission("admin");
    if (sessionError) return sessionError;

    const body = await req.json();
    const { id, title, html, order_index } = body;

    if (!id || !title || !html || order_index === undefined) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    await query(
      `INSERT INTO rules (id, title, html, order_index) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = ?, html = ?, order_index = ?`,
      [id, title, html, order_index, title, html, order_index]
    );

    await logAdminAction(
      "Salvar Regra",
      `Criou ou atualizou a regra: ${title} (${id})`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar regra:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const sessionError = await requirePermission("admin");
    if (sessionError) return sessionError;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    await query(`DELETE FROM rules WHERE id = ?`, [id]);

    await logAdminAction(
      "Deletar Regra",
      `Removeu a regra: ${id}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar regra:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
