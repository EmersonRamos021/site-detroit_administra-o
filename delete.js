const mysql = require('mysql2/promise');
const fs = require('fs');

async function run() {
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const dbUrlMatch = env.match(/DATABASE_URL="?([^"\n]+)"?/);
    const dbUrl = dbUrlMatch ? dbUrlMatch[1] : null;
    
    if (!dbUrl) throw new Error("DATABASE_URL not found in .env.local");

    const db = await mysql.createConnection(dbUrl);
    const [res] = await db.execute("DELETE FROM products WHERE title LIKE '%Punição Discord%' AND active = 0");
    console.log('Success:', res);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

run();
