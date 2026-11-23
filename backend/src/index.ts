import express, { Request, Response } from "express";
import { Pool } from "pg";
import { validateMaterial } from "./validation";

const port = Number(process.env.PORT) || 3000;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const app = express();
app.use(express.json());

async function initDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS materials (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      subject VARCHAR(120) NOT NULL,
      category VARCHAR(60) NOT NULL,
      author VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

app.get("/health", async (_req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

app.get("/api/materials", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, title, subject, category, author, created_at FROM materials ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch materials:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.post("/api/materials", async (req: Request, res: Response) => {
  const validation = validateMaterial(req.body);
  if (!validation.valid || !validation.data) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const { title, subject, category, author } = validation.data;

  try {
    const result = await pool.query(
      `INSERT INTO materials (title, subject, category, author)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, subject, category, author, created_at`,
      [title, subject, category, author]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to create material:", err);
    res.status(500).json({ error: "Failed to save material" });
  }
});

async function start(): Promise<void> {
  await initDatabase();
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`StudShare Backend API listening on port ${port}`);
  });

  // 12-Factor IX (Disposability): коректне завершення роботи на SIGTERM/SIGINT
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Closing HTTP server and DB pool...`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("Startup error:", err);
  process.exit(1);
});