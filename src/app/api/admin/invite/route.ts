import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token e senha são obrigatórios" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter no mínimo 6 caracteres" }, { status: 400 });
    }

    const admins = await query<any>(
      "SELECT id FROM admins WHERE invite_token = ?",
      [token]
    );

    if (admins.length === 0) {
      return NextResponse.json({ error: "Convite inválido ou expirado" }, { status: 400 });
    }

    const admin = admins[0];
    const passwordHash = await bcrypt.hash(password, 10);

    await query(
      "UPDATE admins SET password_hash = ?, invite_token = NULL WHERE id = ?",
      [passwordHash, admin.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao definir senha do convite:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
