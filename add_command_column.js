const fs = require('fs');
let url = '';
if (fs.existsSync('.env.local')) {
  url = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith('DATABASE_URL='))?.split('=')[1]?.trim();
}
const mysql = require('mysql2/promise');

async function migrate() {
  try {
    const connection = await mysql.createConnection({
      uri: url,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log("Conectado. Adicionando in_game_command...");
    
    try {
      await connection.query("ALTER TABLE products ADD COLUMN in_game_command VARCHAR(255) NULL");
      console.log("Coluna in_game_command adicionada com sucesso!");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("A coluna in_game_command já existe.");
      } else {
        throw e;
      }
    }
    
    await connection.end();
  } catch (err) {
    console.error("Erro:", err);
  }
}
migrate();
