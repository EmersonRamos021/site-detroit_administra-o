const fs = require('fs');
let url = '';
if (fs.existsSync('.env.local')) {
  url = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith('DATABASE_URL='))?.split('=')[1]?.trim();
}
const mysql = require('mysql2/promise');

async function fixSchema() {
  try {
    const connection = await mysql.createConnection({
      uri: url,
      ssl: { rejectUnauthorized: false }
    });
    console.log("Conectado. Removendo NOT NULL do password_hash...");
    await connection.query(
      "ALTER TABLE admins MODIFY COLUMN password_hash VARCHAR(255) NULL;"
    );
    console.log("Coluna password_hash alterada para permitir NULL.");
    await connection.end();
  } catch (err) {
    console.error("Erro:", err);
  }
}
fixSchema();
