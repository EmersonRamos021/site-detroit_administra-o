import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    // Verifica se a coluna email já existe
    const columns = await query<any>("SHOW COLUMNS FROM admins");
    const colNames = columns.map(c => c.Field);
    
    // Verifica se a tabela admin_logs existe
    await query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_email VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    updates.push("admin_logs table checked/created");

    if (!colNames.includes("email")) {
      await query("ALTER TABLE admins ADD COLUMN email VARCHAR(255) NULL UNIQUE AFTER id");
      updates.push("email added");
    }
    
    if (!colNames.includes("role")) {
      await query("ALTER TABLE admins ADD COLUMN role ENUM('superadmin', 'staff') NOT NULL DEFAULT 'staff'");
      updates.push("role added");
    }
    
    if (!colNames.includes("permissions")) {
      await query("ALTER TABLE admins ADD COLUMN permissions JSON NULL");
      updates.push("permissions added");
    }
    
    if (!colNames.includes("invite_token")) {
      await query("ALTER TABLE admins ADD COLUMN invite_token VARCHAR(255) NULL UNIQUE");
      updates.push("invite_token added");
    }
    
    // Atualiza o user atual para ser o superadmin e ter o email e senha nova
    const rows = await query<any>("SELECT id FROM admins LIMIT 1");
    if (rows.length > 0) {
      const id = rows[0].id;
      const email = "detroitroleplay2k26@gmail.com";
      const permissions = JSON.stringify(["all"]);
      const newPasswordHash = "$2b$10$y08BJrck8jdi1AMiIMs0SugH4CkKa6HGyNfCbnb3uJsosQCemjOQS";
      
      await query(
        "UPDATE admins SET email = ?, role = 'superadmin', permissions = ?, password_hash = ? WHERE id = ?",
        [email, permissions, newPasswordHash, id]
      );
      updates.push(`admin updated to ${email} with new password`);
    }
    
    return NextResponse.json({ success: true, updates });
  } catch (error) {
    console.error("Erro no setup-db:", error);
    return NextResponse.json({ error: "Erro ao migrar bd", details: String(error) }, { status: 500 });
  }
}
