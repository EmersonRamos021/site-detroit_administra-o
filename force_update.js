const fs = require('fs');
let url = '';
if (fs.existsSync('.env.local')) {
  url = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith('DATABASE_URL='))?.split('=')[1]?.trim();
}
const mysql = require('mysql2/promise');

async function forceUpdate() {
  try {
    const connection = await mysql.createConnection({
      uri: url,
      ssl: { rejectUnauthorized: false }
    });
    console.log("Conectado. Forçando atualização da senha...");
    const newPasswordHash = "$2b$10$y08BJrck8jdi1AMiIMs0SugH4CkKa6HGyNfCbnb3uJsosQCemjOQS";
    const [result] = await connection.query(
      "UPDATE admins SET password_hash = ? WHERE email = 'detroitroleplay2k26@gmail.com'",
      [newPasswordHash]
    );
    console.log("Atualizado:", result.affectedRows, "linhas");
    await connection.end();
  } catch (err) {
    console.error(err);
  }
}
forceUpdate();
