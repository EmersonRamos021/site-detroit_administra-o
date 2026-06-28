const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    uri: 'mysql://squarecloud:Vj97q4yUDfq1956L7u4VkFdD@square-cloud-db-97e08bacae424b3ba3dea7f7c0292232.squareweb.app:7140/squarecloud',
    ssl: { rejectUnauthorized: false }
  });
  
  const [rows] = await connection.execute("SELECT id, channel_name FROM tickets ORDER BY id DESC LIMIT 5");
  console.log(rows);
  
  connection.end();
}

test().catch(console.error);
