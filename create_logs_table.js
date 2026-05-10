const fs = require('fs');
let url = '';
if (fs.existsSync('.env.local')) {
  url = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith('DATABASE_URL='))?.split('=')[1]?.trim();
}
const mysql = require('mysql2/promise');

async function createTable() {
  try {
    const connection = await mysql.createConnection({
      uri: url,
      ssl: { rejectUnauthorized: false }
    });
    console.log("Conectado. Criando tabela admin_logs...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_email VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Tabela admin_logs criada com sucesso.");
    await connection.end();
  } catch (err) {
    console.error("Erro:", err);
  }
}
createTable();
