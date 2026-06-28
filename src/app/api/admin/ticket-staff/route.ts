import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/auth";
import { logAdminAction } from "@/lib/logger";

async function ensureTableExists() {
  await query(`
    CREATE TABLE IF NOT EXISTS ticket_staff (
      id INT AUTO_INCREMENT PRIMARY KEY,
      discord_id VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) DEFAULT NULL,
      categories JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tentar adicionar a coluna 'name' caso a tabela já exista sem ela
  try {
    await query("ALTER TABLE ticket_staff ADD COLUMN name VARCHAR(255) DEFAULT NULL");
  } catch (e: any) {
    // ER_DUP_FIELDNAME (1060) significa que a coluna já existe, podemos ignorar.
    if (e.code !== 'ER_DUP_FIELDNAME' && e.errno !== 1060) {
      console.error("Erro ao adicionar coluna name:", e);
    }
  }
}

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "superadmin" && !session?.user?.permissions?.includes("staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureTableExists();
    const staff = await query("SELECT id, name, discord_id, categories FROM ticket_staff ORDER BY id ASC");
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
    const { discord_id, name, categories } = await req.json();

    if (!discord_id) {
      return NextResponse.json({ error: "Discord ID obrigatório" }, { status: 400 });
    }

    const categoriesJson = JSON.stringify(categories || []);
    const staffName = name || "";

    // Upsert
    await query(
      "INSERT INTO ticket_staff (discord_id, name, categories) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), categories = VALUES(categories)",
      [discord_id, staffName, categoriesJson]
    );

    await logAdminAction(session.user.email!, "CONFIGURAR_TICKET_STAFF", `Discord ID: ${discord_id}, Nome: ${staffName}, Categorias: ${categoriesJson}`);

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

    await logAdminAction(session.user.email!, "DELETAR_TICKET_STAFF", `ID: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete ticket staff" }, { status: 500 });
  }
}
