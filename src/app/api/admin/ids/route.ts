import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePermission } from "@/lib/auth-check";
import { logAdminAction } from "@/lib/logger";

interface DbId {
  game_id: number;
  status: string;
}

// Inicializador da tabela
async function ensureTable() {
  await query(`
      CREATE TABLE IF NOT EXISTS game_ids (
        game_id INT PRIMARY KEY,
        status ENUM('reservado', 'vendido', 'indisponivel') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admin_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS rules (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        html LONGTEXT NOT NULL,
        order_index INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

  // Migração segura para adicionar o status vendido caso a tabela já exista
  try {
    await query(`ALTER TABLE game_ids MODIFY COLUMN status ENUM('reservado', 'vendido', 'indisponivel') NOT NULL;`);
  } catch(e) {
    // Ignorar se já estiver no formato correto
  }
}

export async function GET() {
  const session = await requirePermission("ids");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureTable();

  try {
    const ids = await query<DbId>("SELECT game_id, status FROM game_ids");
    return NextResponse.json(ids);
  } catch (error) {
    console.error("Erro ao buscar IDs:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await requirePermission("ids");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { game_id, status } = await req.json();

    if (!game_id) {
      return NextResponse.json({ error: "ID Inválido" }, { status: 400 });
    }

    await ensureTable();

    // Buscando o status anterior para fazer automação financeira
    const oldQuery = await query<{status: string}>("SELECT status FROM game_ids WHERE game_id = ?", [game_id]);
    const oldStatus = oldQuery.length > 0 ? oldQuery[0].status : "disponivel";

    if (status === "disponivel") {
      // Deleta da tabela, pois tudo que não está lá é branco/disponível
      await query("DELETE FROM game_ids WHERE game_id = ?", [game_id]);
    } else {
      // Insere ou atualiza o status
      await query(
        `INSERT INTO game_ids (game_id, status) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE status = ?`,
        [game_id, status, status]
      );
    }

    // --- AUTOMAÇÃO DO FINANCEIRO ---
    function getPrice(id: number) {
      if (id < 10) return 0;
      if (id < 100) return 89.90;
      if (id < 1000) return 69.90;
      if (id <= 9999) return 49.90;
      return 0;
    }

    await query(`
      CREATE TABLE IF NOT EXISTS finance_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('entrada', 'saida') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Log de Entrada Automática
    if (status === "vendido" && oldStatus !== "vendido") {
      await query(
        `INSERT INTO finance_transactions (type, amount, description, category) VALUES (?, ?, ?, ?)`,
        ["entrada", getPrice(game_id), `Venda de ID Automática (#${game_id})`, "Venda ID"]
      );
    } 
    // Log de Estorno/Saída Automática se estava vendido e parou de ser
    else if (oldStatus === "vendido" && status !== "vendido") {
      await query(
        `INSERT INTO finance_transactions (type, amount, description, category) VALUES (?, ?, ?, ?)`,
        ["saida", getPrice(game_id), `Estorno/Remoção de ID (#${game_id})`, "Estorno ID"]
      );
    }
    // --------------------------------

    await logAdminAction(session.user.email!, "EDITAR_STATUS_ID", `ID ${game_id} alterado de ${oldStatus} para ${status}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao alterar ID:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
