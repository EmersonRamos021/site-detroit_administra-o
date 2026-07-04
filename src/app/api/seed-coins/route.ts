import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    // 1. Verificar se a categoria coins existe
    const cats: any = await query("SELECT id FROM categories WHERE slug = 'coins'");
    let coinsId;

    if (cats.length === 0) {
      const result: any = await query(
        "INSERT INTO categories (name, slug, icon, sort_order) VALUES (?, ?, ?, ?)",
        ['Coins', 'coins', '🪙', 5]
      );
      coinsId = result.insertId;
    } else {
      coinsId = cats[0].id;
    }

    // 2. Adicionar os produtos
    const produtos = [
      ["1.000 Coins", "Receba 1.000 Coins para gastar como quiser no servidor.", 1.00, "/detroit_bg.png", coinsId, 0, "add_coins:{conta}:1000"],
      ["5.000 Coins", "Receba 5.000 Coins para gastar como quiser no servidor.", 5.00, "/detroit_bg.png", coinsId, 0, "add_coins:{conta}:5000"],
      ["10.000 Coins", "Receba 10.000 Coins para gastar como quiser no servidor.", 10.00, "/detroit_bg.png", coinsId, 1, "add_coins:{conta}:10000"],
      ["50.000 Coins", "Receba 50.000 Coins para comprar carros exclusivos no servidor.", 50.00, "/detroit_bg.png", coinsId, 1, "add_coins:{conta}:50000"],
      ["100.000 Coins", "Pacote Magnata! Receba 100.000 Coins e domine a cidade.", 100.00, "/detroit_bg.png", coinsId, 1, "add_coins:{conta}:100000"],
    ];

    const logs = [];
    for (const p of produtos) {
      const existing: any = await query("SELECT id FROM products WHERE title = ?", [p[0]]);
      if (existing.length === 0) {
        await query(
          "INSERT INTO products (title, description, price, image_url, category_id, featured, in_game_command) VALUES (?, ?, ?, ?, ?, ?, ?)",
          p
        );
        logs.push(`Produto ${p[0]} adicionado!`);
      } else {
        logs.push(`Produto ${p[0]} já existe.`);
      }
    }

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
