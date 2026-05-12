const mysql = require('mysql2/promise');

async function checkRoles() {
  const connection = await mysql.createConnection({
    uri: 'mysql://squarecloud:Vj97q4yUDfq1956L7u4VkFdD@square-cloud-db-97e08bacae424b3ba3dea7f7c0292232.squareweb.app:7140/squarecloud',
    ssl: { rejectUnauthorized: false }
  });
  
  const [rows] = await connection.execute("SELECT id, email, role FROM admins");
  console.log(rows);
  
  connection.end();
}

checkRoles().catch(console.error);
