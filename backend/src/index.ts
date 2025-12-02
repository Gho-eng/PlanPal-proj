import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "./utils/prisma";
import { Expense, User, UserLogin, Category } from "../types/Users";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    exposedHeaders: ["Authorization"],
    credentials: true,
  })
);

app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.API_KEY || "dev-secret";

// Signup
app.post("/signup", async (req, res) => {
  try {
    const payload = req.body as User;
    if (!payload.email || !payload.username || !payload.password) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }
    const hashed = await bcrypt.hash(payload.password, 10);
    const created = await db.user.create({
      data: { email: payload.email, username: payload.username, password: hashed },
    });
    res.json({ success: true, data: { id: created.id, email: created.email, username: created.username } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || err });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const payload = req.body as UserLogin;
    if (!payload.email || !payload.password)
      return res.status(400).json({ success: false, error: "Missing credentials" });

    const user = await db.user.findUnique({ where: { email: payload.email } });
    if (!user) return res.status(401).json({ success: false, error: "Invalid credentials" });

    const ok = await bcrypt.compare(payload.password, user.password);
    if (!ok) return res.status(401).json({ success: false, error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ success: true, data: { token, user: { id: user.id, email: user.email, username: user.username } } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || err });
  }
});

// Auth middleware (optional: attaches userId if token present)
function authMiddleware(req: express.Request, _res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return next();
  const token = auth.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    (req as any).userId = payload.id;
  } catch {
    // ignore invalid token
  }
  next();
}
app.use(authMiddleware);

// Profiles
app.get("/api/profiles/:id", async (req, res) => {
  const id = Number(req.params.id);
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ success: false, error: "User not found" });
  res.json({ success: true, data: { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt } });
});

app.put("/api/profiles/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username } = req.body;
    const updated = await db.user.update({ where: { id }, data: { username } });
    res.json({ success: true, data: { id: updated.id, username: updated.username } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || err });
  }
});

// Categories
app.get("/api/categories", async (req, res) => {
  const userId = req.query.userId ? Number(req.query.userId) : undefined;
  const where = userId ? { userId } : undefined;
  const data = await db.category.findMany({ where, orderBy: { name: "asc" } });
  res.json({ success: true, data });
});

app.post("/api/categories", async (req, res) => {
  try {
    const payload = req.body as Category;
    const created = await db.category.create({ data: { userId: payload.userId, name: payload.name } });
    res.json({ success: true, data: created });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || err });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.category.delete({ where: { id } });
    res.json({ success: true, data: null });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || err });
  }
});

// Expenses
app.get("/api/expenses", async (req, res) => {
  const userId = req.query.userId ? Number(req.query.userId) : undefined;
  const where = userId ? { userId } : undefined;
  const data = await db.expense.findMany({ where, orderBy: { date: "desc" } });
  res.json({ success: true, data });
});

app.post("/api/expenses", async (req, res) => {
  try {
    const payload = req.body as Expense;
    const created = await db.expense.create({ data: payload as any });
    res.json({ success: true, data: created });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || err });
  }
});

app.put("/api/expenses/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = await db.expense.update({ where: { id }, data: req.body });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || err });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.expense.delete({ where: { id } });
    res.json({ success: true, data: null });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || err });
  }
});

// Goals (generic CRUD)
app.get("/api/goals", async (req, res) => {
  const userId = req.query.userId ? Number(req.query.userId) : undefined;
  const where = userId ? { userId } : undefined;
  const data = await db.goal.findMany({ where, orderBy: { createdAt: "desc" } });
  res.json({ success: true, data });
});

app.post("/api/goals", async (req, res) => {
  try {
    const created = await db.goal.create({ data: req.body as any });
    res.json({ success: true, data: created });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || err });
  }
});

app.put("/api/goals/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = await db.goal.update({ where: { id }, data: req.body });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || err });
  }
});

app.delete("/api/goals/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.goal.delete({ where: { id } });
    res.json({ success: true, data: null });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || err });
  }
});

// Health
app.get("/health", (_req, res) => res.json({ success: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



