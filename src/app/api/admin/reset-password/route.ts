import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const confirm = searchParams.get("confirm");

    if (confirm !== "yes") {
      return Response.json({ 
        message: "Para confirmar a redefinição de senha da conta principal, acesse a URL com ?confirm=yes no final."
      });
    }

    const newPassword = "detroitrp555.";
    const hash = await bcrypt.hash(newPassword, 10);

    const result: any = await query(
      "UPDATE admins SET password_hash = ? WHERE role = 'superadmin'",
      [hash]
    );

    return Response.json({ 
      success: true, 
      message: `Senha da conta principal atualizada com sucesso! A nova senha é: detroitrp555.`
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
