import { query } from "./db";

/**
 * Registra uma ação de auditoria no banco de dados.
 * @param adminEmail O e-mail do admin que executou a ação
 * @param action O nome da ação (ex: 'CRIAR_PRODUTO', 'EXCLUIR_STAFF')
 * @param details Uma descrição em string (pode ser JSON) com os detalhes do que foi modificado
 */
export async function logAdminAction(adminEmail: string, action: string, details: string = "") {
  try {
    await query(
      "INSERT INTO admin_logs (admin_email, action, details) VALUES (?, ?, ?)",
      [adminEmail, action, details]
    );
  } catch (error) {
    console.error("Falha ao salvar log de auditoria:", error);
    // Não lança o erro para não quebrar o fluxo principal da aplicação
  }
}
