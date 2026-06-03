import { query } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return Response.json({ message: "Coloque ?email=emaildapessoa@gmail.com na URL para excluir o acesso." });
    }

    await query("DELETE FROM admins WHERE email = ?", [email]);
    return Response.json({ success: true, message: `O email ${email} foi DELETADO do sistema com sucesso! Ele perdeu o acesso ao login.` });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
