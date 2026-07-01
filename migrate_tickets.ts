import { query } from "./src/lib/db";

async function migrate() {
  try {
    console.log("Adicionando colunas de avaliação na tabela tickets...");
    try {
      await query("ALTER TABLE tickets ADD COLUMN closed_by_id VARCHAR(30) DEFAULT NULL AFTER closed_by");
    } catch(e: any) { if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message); }
    
    try {
      await query("ALTER TABLE tickets ADD COLUMN rating INT DEFAULT NULL");
    } catch(e: any) { if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message); }
    
    try {
      await query("ALTER TABLE tickets ADD COLUMN review_comment TEXT DEFAULT NULL");
    } catch(e: any) { if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message); }
    
    console.log("Migração concluída com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro geral:", error);
    process.exit(1);
  }
}

migrate();
