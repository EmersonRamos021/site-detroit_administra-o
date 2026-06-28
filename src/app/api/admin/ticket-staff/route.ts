import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/auth";
import { logAdminAction } from "@/lib/logger";

async function ensureTableExists() {
  await query(`
    CREATE TABLE IF NOT EXISTS ticket_staff (
      id INT AUTO_INCREMENT PRIMARY KEY,
      discord_id VARCHAR(255) NOT NULL UNIQUE,
      categories JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "superadmin" && !session?.user?.permissions?.includes("staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureTableExists();
    const staff = await query("SELECT id, discord_id, categories FROM ticket_staff ORDER BY id ASC");
    return NextResponse.json(staff);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch ticket staff" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "superadmin" && !session?.user?.permissions?.includes("staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureTableExists();
    const { discord_id, categories } = await req.json();

    if (!discord_id) {
      return NextResponse.json({ error: "Discord ID obrigatório" }, { status: 400 });
    }

    const categoriesJson = JSON.stringify(categories || []);

    // Upsert
    await query(
      "INSERT INTO ticket_staff (discord_id, categories) VALUES (?, ?) ON DUPLICATE KEY UPDATE categories = VALUES(categories)",
      [discord_id, categoriesJson]
    );

    await logAdminAction(session.user.email!, "CONFIGURAR_TICKET_STAFF", \`Discord ID: \${discord_id}, Categorias: \${categoriesJson}\`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create/update ticket staff" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "superadmin" && !session?.user?.permissions?.includes("staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    await query("DELETE FROM ticket_staff WHERE id = ?", [id]);

    await logAdminAction(session.user.email!, "DELETAR_TICKET_STAFF", \`ID: \${id}\`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete ticket staff" }, { status: 500 });
  }
}
