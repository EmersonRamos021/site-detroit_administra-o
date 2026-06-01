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

    // Primeiro, deleta qualquer histórico de item de pedido que tenha esse produto
    // Isso evita o erro de 'foreign key constraint' (ER_ROW_IS_REFERENCED_2)
    await query(`
      DELETE FROM order_items 
      WHERE product_id IN (
        SELECT id FROM products WHERE title LIKE '%Punição Discord%' AND active = 0
      )
    `);

    // Em seguida, deleta os produtos
    const result: any = await query(
      "DELETE FROM products WHERE title LIKE '%Punição Discord%' AND active = 0"
    );

    return Response.json({ 
      success: true, 
      message: `Deletado com sucesso! Linhas de produtos afetadas: ${result.affectedRows || 'desconhecido'}`
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
