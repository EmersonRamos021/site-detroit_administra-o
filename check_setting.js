const mysql = require('mysql2/promise');
const fs = require('fs');

async function check() {
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const dbUrlMatch = env.match(/DATABASE_URL="?([^"\n]+)"?/);
    if (!dbUrlMatch) throw new Error("No DB URL");
    
    const db = await mysql.createConnection(dbUrlMatch[1]);
    const [rows] = await db.execute("SELECT * FROM settings WHERE `key` = 'memberCounterChannelId'");
    console.log(rows);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
check();
