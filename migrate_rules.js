require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrate() {
    console.log("Iniciando migração de regras do arquivo JSON para o Banco de Dados...");
    
    // Ler o json
    const jsonPath = path.join(__dirname, '../site/src/app/regras/rules.json');
    if (!fs.existsSync(jsonPath)) {
        console.error("❌ Arquivo rules.json não encontrado no diretório: ", jsonPath);
        return;
    }

    const rulesData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Conectar ao DB
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL não configurado no .env");
        return;
    }

    const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    // Criar tabela
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS rules (
            id VARCHAR(255) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            html LONGTEXT NOT NULL,
            order_index INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ Tabela 'rules' criada/verificada com sucesso.");

    // Inserir os dados
    let index = 1;
    for (const section of rulesData.sections) {
        const [rows] = await connection.execute('SELECT id FROM rules WHERE id = ?', [section.id]);
        
        if (rows.length === 0) {
            await connection.execute(
                'INSERT INTO rules (id, title, html, order_index) VALUES (?, ?, ?, ?)',
                [section.id, section.title, section.html, index]
            );
            console.log(`✅ Regra inserida: ${section.title}`);
        } else {
            await connection.execute(
                'UPDATE rules SET title = ?, html = ?, order_index = ? WHERE id = ?',
                [section.title, section.html, index, section.id]
            );
            console.log(`🔄 Regra atualizada: ${section.title}`);
        }
        index++;
    }

    console.log("🎉 Migração concluída com sucesso!");
    await connection.end();
}

migrate().catch(err => {
    console.error("Erro fatal na migração:", err);
    process.exit(1);
});
