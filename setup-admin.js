const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("No DATABASE_URL found");
    process.exit(1);
  }

  const pool = mysql.createPool({ 
    uri: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Creating admins table...");
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const username = "detroitroleplay2k26@gmaill.com";
    const plainPassword = "Detroit2k26@roleplay";
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const [existing] = await pool.execute(
      "SELECT id FROM admins WHERE username = ?",
      [username]
    );

    if (existing.length === 0) {
      await pool.execute(
        "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
        [username, passwordHash]
      );
      console.log("Default admin user created! (" + username + ")");
    } else {
      console.log("Admin user already exists. Skipping insertion.");
    }
  } catch (err) {
    console.error("Error setting up DB:", err);
  } finally {
    await pool.end();
  }
}

run();
