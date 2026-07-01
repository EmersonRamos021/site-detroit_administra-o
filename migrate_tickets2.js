const fs = require('fs');
const mysql = require('mysql2/promise');

async function migrate() {
  try {
    const envFile = fs.readFileSync('.env', 'utf8');
    const dbUrlMatch = envFile.match(/DATABASE_URL=["']?([^"'\n]+)/);
    if (!dbUrlMatch) throw new Error("DATABASE_URL not found in .env");
    
    const dbUrl = dbUrlMatch[1];
    const db = await mysql.createConnection({
      uri: dbUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log("Adicionando colunas de avaliação na tabela tickets...");
    
    try {
      await db.execute("ALTER TABLE tickets ADD COLUMN closed_by_id VARCHAR(30) DEFAULT NULL AFTER closed_by");
    } catch(e) { if (e.errno !== 1060) console.error(e.message); }
    
    try {
      await db.execute("ALTER TABLE tickets ADD COLUMN rating INT DEFAULT NULL");
    } catch(e) { if (e.errno !== 1060) console.error(e.message); }
    
    try {
      await db.execute("ALTER TABLE tickets ADD COLUMN review_comment TEXT DEFAULT NULL");
    } catch(e) { if (e.errno !== 1060) console.error(e.message); }
    
    console.log("Migração concluída com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro:", error);
    process.exit(1);
  }
}

migrate();
