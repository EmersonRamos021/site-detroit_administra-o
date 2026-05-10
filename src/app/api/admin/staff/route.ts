import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/auth";
import crypto from "crypto";
import { logAdminAction } from "@/lib/logger";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admins = await query("SELECT id, email, role, permissions, invite_token FROM admins ORDER BY id ASC");
    return NextResponse.json(admins);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, permissions } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
    }

    const inviteToken = crypto.randomBytes(32).toString("hex");
    const permsJson = JSON.stringify(permissions || []);

    await query(
      "INSERT INTO admins (email, role, permissions, invite_token) VALUES (?, 'staff', ?, ?)",
      [email, permsJson, inviteToken]
    );

    await logAdminAction(session.user.email!, "CRIAR_STAFF", `Email: ${email}, Permissões: ${permsJson}`);

    return NextResponse.json({ success: true, inviteToken });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: "Este email já está cadastrado." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create staff" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, permissions } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    // Bloqueia a edição das permissões de id = 1 ou de superadmins
    if (id === 1) {
      return NextResponse.json({ error: "Não é possível alterar as permissões do superadmin." }, { status: 400 });
    }

    const permsJson = JSON.stringify(permissions || []);

    await query(
      "UPDATE admins SET permissions = ? WHERE id = ?",
      [permsJson, id]
    );

    await logAdminAction(session.user.email!, "EDITAR_PERMISSOES_STAFF", `ID: ${id}, Novas Permissões: ${permsJson}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    
    // Bloquear deletar a si mesmo ou id = 1
    if (id.toString() === session?.user?.id || id === 1) {
      return NextResponse.json({ error: "Não é possível excluir esta conta" }, { status: 400 });
    }

    await query("DELETE FROM admins WHERE id = ?", [id]);
    await logAdminAction(session.user.email!, "EXCLUIR_STAFF", `ID excluído: ${id}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
  }
}
