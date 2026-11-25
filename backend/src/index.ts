import express, { NextFunction, Request, Response } from "express";
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

// Prometheus RED metrics (Rate, Errors, Duration)
const httpRequestsTotal = new Map<string, number>();
const durationBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5];
const bucketCounts = new Array<number>(durationBuckets.length).fill(0);
let durationSum = 0;
let durationCount = 0;

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === "/metrics") {
    next();
    return;
  }
  const startNs = process.hrtime.bigint();
  res.on("finish", () => {
    const durationSec = Number(process.hrtime.bigint() - startNs) / 1e9;
    const key = `${req.method}|${req.path}|${res.statusCode}`;
    httpRequestsTotal.set(key, (httpRequestsTotal.get(key) ?? 0) + 1);

    durationSum += durationSec;
    durationCount += 1;
    for (let i = 0; i < durationBuckets.length; i += 1) {
      if (durationSec <= durationBuckets[i]) {
        bucketCounts[i] += 1;
      }
    }
  });
  next();
});

app.get("/metrics", (_req: Request, res: Response) => {
  const lines: string[] = [
    "# HELP http_requests_total Total number of HTTP requests",
    "# TYPE http_requests_total counter",
  ];

  httpRequestsTotal.forEach((count, key) => {
    const [method, route, status] = key.split("|");
    lines.push(`http_requests_total{method="${method}",route="${route}",status="${status}"} ${count}`);
  });

  lines.push(
    "# HELP http_request_duration_seconds HTTP request latency in seconds",
    "# TYPE http_request_duration_seconds histogram"
  );
  for (let i = 0; i < durationBuckets.length; i += 1) {
    lines.push(`http_request_duration_seconds_bucket{le="${durationBuckets[i]}"} ${bucketCounts[i]}`);
  }
  lines.push(`http_request_duration_seconds_bucket{le="+Inf"} ${durationCount}`);
  lines.push(`http_request_duration_seconds_sum ${durationSum.toFixed(6)}`);
  lines.push(`http_request_duration_seconds_count ${durationCount}`);
  lines.push(
    "# HELP process_uptime_seconds Node.js process uptime in seconds",
    "# TYPE process_uptime_seconds gauge",
    `process_uptime_seconds ${process.uptime().toFixed(2)}`
  );

  res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.status(200).send(`${lines.join("\n")}\n`);
});

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