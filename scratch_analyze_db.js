const mysql = require('mysql2/promise');

async function analyzeDb() {
  console.log("Conectando ao banco de dados da cidade...");
  try {
    const connection = await mysql.createConnection({
      uri: 'mysql://u507_cNG0Etu0hE:F9kX1Qxi7.!EdT%40jNbIAE%5E60@151.242.227.127:3306/s507_detroit_roleplay'
    });
    
    const [tables] = await connection.query("SHOW TABLES");
    console.log("\n=== TABELAS ENCONTRADAS ===");
    tables.forEach(row => {
      console.log(Object.values(row)[0]);
    });
    
    await connection.end();
  } catch (error) {
    console.error("Erro ao conectar:", error);
  }
}

analyzeDb();
