const fs = require('fs');
let url = '';
if (fs.existsSync('.env.local')) {
  url = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith('DATABASE_URL='))?.split('=')[1]?.trim();
}
const mysql = require('mysql2/promise');

async function check() {
  try {
    const connection = await mysql.createConnection({
      uri: url,
      ssl: { rejectUnauthorized: false }
    });
    console.log("Conectado. Buscando admins...");
    const [rows] = await connection.query("SELECT id, email, role, invite_token, password_hash FROM admins");
    console.log(rows);
    await connection.end();
  } catch (err) {
    console.error(err);
  }
}
check();
