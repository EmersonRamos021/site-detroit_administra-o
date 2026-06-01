import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const confirm = searchParams.get("confirm");

    if (confirm !== "yes") {
      return Response.json({ 
        message: "Para confirmar a exclusão em massa, acesse a URL com ?confirm=yes no final."
      });
    }

    const result: any = await query(
      "DELETE FROM products WHERE title LIKE '%Punição Discord%' AND active = 0"
    );

    return Response.json({ 
      success: true, 
      message: `Deletado com sucesso! Linhas afetadas: ${result.affectedRows || 'desconhecido'}`
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
