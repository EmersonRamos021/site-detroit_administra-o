import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    // 1. Deletar a categoria Drops se estiver vazia
    await query("DELETE FROM categories WHERE slug = 'drops'");
    
    // 2. Garantir que a categoria Coins existe e tem o sort_order correto
    await query("UPDATE categories SET name = 'Coins', icon = '🪙', sort_order = 4 WHERE slug = 'coins'");

    // 3. Atualizar os produtos para garantir que pertencem à categoria correta
    const [cats]: any = await query("SELECT id FROM categories WHERE slug = 'coins'");
    if (cats.length > 0) {
      const coinsId = cats[0].id;
      await query("UPDATE products SET category_id = ? WHERE title LIKE '%Coins%'", [coinsId]);
    }

    return NextResponse.json({ success: true, message: "Drops removido, Coins organizado!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
