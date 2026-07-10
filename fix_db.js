require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        console.log("Conectado ao banco remoto!");
        
        // Ver todas as categorias
        const [cats] = await conn.execute("SELECT * FROM categories");
        console.log("Categorias no banco:", cats);

        // Deletar a categoria Drops (ID 4)
        console.log("Deletando categoria Drops (slug: drops)...");
        await conn.execute("DELETE FROM categories WHERE slug = 'drops'");
        
        // Garantir que Coins (slug: coins) tem a ordem correta (agora que tiramos Drops, ele fica na ordem 4)
        console.log("Ajustando categoria Coins...");
        await conn.execute("UPDATE categories SET sort_order = 4 WHERE slug = 'coins'");

        console.log("Pronto!");
    } catch (e) {
        console.error("Erro:", e);
    } finally {
        await conn.end();
    }
}

main();
