import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/auth";

interface DbTransaction {
  id: number;
  type: "entrada" | "saida";
  amount: number;
  description: string;
  category: string;
  created_at: string;
}

// Inicializador da tabela
export async function ensureFinanceTable() {
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
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureFinanceTable();

  try {
    const transactions = await query<DbTransaction>(
      "SELECT * FROM finance_transactions ORDER BY created_at DESC"
    );
    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Erro ao buscar transações financeiras:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type, amount, description, category } = await req.json();

    if (!type || !amount || !description) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    await ensureFinanceTable();

    await query(
      `INSERT INTO finance_transactions (type, amount, description, category) VALUES (?, ?, ?, ?)`,
      [type, amount, description, category || "Manual"]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao adicionar transação financeira:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
