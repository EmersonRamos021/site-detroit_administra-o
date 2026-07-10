const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'detroit_loja'
    });

    try {
        console.log("Verificando categoria Coins...");
        const [cats] = await conn.execute("SELECT id FROM categories WHERE slug = 'coins'");
        let coinsId;

        if (cats.length === 0) {
            console.log("Criando categoria Coins...");
            const [result] = await conn.execute(
                "INSERT INTO categories (name, slug, icon, sort_order) VALUES (?, ?, ?, ?)",
                ['Coins', 'coins', '🪙', 5]
            );
            coinsId = result.insertId;
        } else {
            coinsId = cats[0].id;
        }

        console.log("Categoria Coins ID:", coinsId);

        console.log("Adicionando produtos de Coins...");
        const produtos = [
            ["1.000 Coins", "Receba 1.000 Coins para gastar como quiser no servidor.", 1.00, "/detroit_bg.png", coinsId, 0, "add_coins:{conta}:1000"],
            ["5.000 Coins", "Receba 5.000 Coins para gastar como quiser no servidor.", 5.00, "/detroit_bg.png", coinsId, 0, "add_coins:{conta}:5000"],
            ["10.000 Coins", "Receba 10.000 Coins para gastar como quiser no servidor.", 10.00, "/detroit_bg.png", coinsId, 1, "add_coins:{conta}:10000"],
            ["50.000 Coins", "Receba 50.000 Coins para comprar carros exclusivos no servidor.", 50.00, "/detroit_bg.png", coinsId, 1, "add_coins:{conta}:50000"],
            ["100.000 Coins", "Pacote Magnata! Receba 100.000 Coins e domine a cidade.", 100.00, "/detroit_bg.png", coinsId, 1, "add_coins:{conta}:100000"],
        ];

        for (const p of produtos) {
            const [existing] = await conn.execute("SELECT id FROM products WHERE title = ?", [p[0]]);
            if (existing.length === 0) {
                await conn.execute(
                    "INSERT INTO products (title, description, price, image_url, category_id, featured, in_game_command) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    p
                );
                console.log(`Produto ${p[0]} adicionado!`);
            } else {
                console.log(`Produto ${p[0]} já existe.`);
            }
        }

        console.log("SUCESSO!");
    } catch (e) {
        console.error("Erro:", e);
    } finally {
        await conn.end();
    }
}
main();
