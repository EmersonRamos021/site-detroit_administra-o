const fs = require('fs');
if (fs.existsSync('.env.local')) {
  require('process').env.DATABASE_URL = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith('DATABASE_URL='))?.split('=')[1]?.trim();
} else if (fs.existsSync('.env')) {
  require('process').env.DATABASE_URL = fs.readFileSync('.env', 'utf8').split('\n').find(l => l.startsWith('DATABASE_URL='))?.split('=')[1]?.trim();
}

const mysql = require("mysql2/promise");

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL nao encontrada no .env ou .env.local");
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    uri: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Conectado ao BD. Alterando tabela admins...");
    
    // Verifica se as colunas já existem para evitar erro
    const [columns] = await connection.query("SHOW COLUMNS FROM admins");
    const colNames = columns.map(c => c.Field);
    
    if (!colNames.includes("email")) {
      await connection.query("ALTER TABLE admins ADD COLUMN email VARCHAR(255) NULL UNIQUE AFTER id");
      console.log("- Coluna 'email' adicionada.");
    }
    
    if (!colNames.includes("role")) {
      await connection.query("ALTER TABLE admins ADD COLUMN role ENUM('superadmin', 'staff') NOT NULL DEFAULT 'staff'");
      console.log("- Coluna 'role' adicionada.");
    }
    
    if (!colNames.includes("permissions")) {
      await connection.query("ALTER TABLE admins ADD COLUMN permissions JSON NULL");
      console.log("- Coluna 'permissions' adicionada.");
    }
    
    if (!colNames.includes("invite_token")) {
      await connection.query("ALTER TABLE admins ADD COLUMN invite_token VARCHAR(255) NULL UNIQUE");
      console.log("- Coluna 'invite_token' adicionada.");
    }
    
    // Atualiza o user atual para ser o superadmin e ter o email requisitado
    // Pegar o primeiro admin que existir (provavelmente o único)
    const [rows] = await connection.query("SELECT id FROM admins LIMIT 1");
    if (rows.length > 0) {
      const id = rows[0].id;
      const email = "detroitroleplay2k26@gmail.com";
      const permissions = JSON.stringify(["all"]);
      
      await connection.query(
        "UPDATE admins SET email = ?, role = 'superadmin', permissions = ? WHERE id = ?",
        [email, permissions, id]
      );
      console.log(`- Conta id=${id} atualizada para superadmin com email ${email}`);
    }
    
    // Opcional: remover a coluna username antiga (só se quiser manter limpo, vou comentar por segurança, ou drop se eu tiver certeza)
    // if (colNames.includes("username")) {
    //   await connection.query("ALTER TABLE admins DROP COLUMN username");
    //   console.log("- Coluna 'username' removida.");
    // }
    
    console.log("Migração concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao migrar:", error);
  } finally {
    await connection.end();
  }
}

migrate();
