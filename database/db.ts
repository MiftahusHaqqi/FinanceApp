import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

// ─── Buka database ────────────────────────────────────────────────────────────
function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync("financeapp.db");
  }
  return db;
}

// ─── Setup tabel ──────────────────────────────────────────────────────────────
export function setupDatabase(): void {
  const database = getDb();

  try {
    database.execSync(`PRAGMA journal_mode = WAL`);
  } catch (e) {
    console.warn("PRAGMA warning (ignored):", e);
  }

  database.execSync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      type       TEXT NOT NULL,
      amount     REAL NOT NULL,
      category   TEXT NOT NULL,
      note       TEXT DEFAULT '',
      date       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    )
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS category_budgets (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      year       INTEGER NOT NULL,
      month      INTEGER NOT NULL,
      category   TEXT NOT NULL,
      amount     REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      UNIQUE(year, month, category)
    )
  `);

  console.log("✅ Database setup selesai");
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type TransactionType = "income" | "expense";

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string;
  created_at: string;
}

export interface NewTransaction {
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string;
}

// ─── Insert ───────────────────────────────────────────────────────────────────
export function insertTransaction(data: NewTransaction): void {
  console.log("📝 Insert:", data);
  getDb().runSync(
    `INSERT INTO transactions (type, amount, category, note, date)
     VALUES (?, ?, ?, ?, ?)`,
    [data.type, data.amount, data.category, data.note ?? "", data.date]
  );
}

// ─── Ambil per bulan ──────────────────────────────────────────────────────────
export function getTransactionsByMonth(
  year: number,
  month: number
): Transaction[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  console.log("📅 Query bulan:", prefix);
  try {
    const rows = getDb().getAllSync(
      `SELECT id, type, amount, category, note, date, created_at
       FROM transactions
       WHERE date LIKE ?
       ORDER BY date DESC, created_at DESC`,
      [`${prefix}%`]
    ) as any[];

    console.log("📦 Raw rows:", JSON.stringify(rows[0] ?? "kosong"));

    return rows.map((row) => ({
      id: Number(row.id),
      type: String(row.type) as TransactionType,
      amount: Number(row.amount),
      category: String(row.category),
      note: String(row.note ?? ""),
      date: String(row.date),
      created_at: String(row.created_at),
    }));
  } catch (e) {
    console.error("❌ getTransactionsByMonth error:", e);
    return [];
  }
}

// ─── Summary bulanan ──────────────────────────────────────────────────────────
export interface MonthlySummary {
  total_income: number;
  total_expense: number;
}

export function getMonthlySummary(year: number, month: number): MonthlySummary {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  try {
    const row = getDb().getFirstSync(
      `SELECT
         SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS total_income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
       FROM transactions
       WHERE date LIKE ?`,
      [`${prefix}%`]
    ) as any;

    console.log("💰 Summary raw:", JSON.stringify(row));

    return {
      total_income: Number(row?.total_income ?? 0),
      total_expense: Number(row?.total_expense ?? 0),
    };
  } catch (e) {
    console.error("❌ getMonthlySummary error:", e);
    return { total_income: 0, total_expense: 0 };
  }
}

// ─── Breakdown per kategori ───────────────────────────────────────────────────
export interface CategorySummary {
  category: string;
  total: number;
}

export interface CategoryBudget {
  category: string;
  amount: number;
}

export function getExpenseByCategory(
  year: number,
  month: number
): CategorySummary[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  try {
    const rows = getDb().getAllSync(
      `SELECT category, SUM(amount) AS total
       FROM transactions
       WHERE type = 'expense' AND date LIKE ?
       GROUP BY category
       ORDER BY total DESC`,
      [`${prefix}%`]
    ) as any[];

    return rows.map((row) => ({
      category: String(row.category),
      total: Number(row.total),
    }));
  } catch (e) {
    console.error("❌ getExpenseByCategory error:", e);
    return [];
  }
}

export function getCategoryBudgets(
  year: number,
  month: number
): CategoryBudget[] {
  try {
    const rows = getDb().getAllSync(
      `SELECT category, amount
       FROM category_budgets
       WHERE year = ? AND month = ?
       ORDER BY category ASC`,
      [year, month]
    ) as any[];

    return rows.map((row) => ({
      category: String(row.category),
      amount: Number(row.amount ?? 0),
    }));
  } catch (e) {
    console.error("getCategoryBudgets error:", e);
    return [];
  }
}

export function upsertCategoryBudget(
  year: number,
  month: number,
  category: string,
  amount: number
): void {
  getDb().runSync(
    `INSERT INTO category_budgets (year, month, category, amount, updated_at)
     VALUES (?, ?, ?, ?, datetime('now','localtime'))
     ON CONFLICT(year, month, category)
     DO UPDATE SET amount = excluded.amount,
                   updated_at = datetime('now','localtime')`,
    [year, month, category, amount]
  );
}

// ─── Hapus ────────────────────────────────────────────────────────────────────
export function deleteTransaction(id: number): void {
  getDb().runSync(`DELETE FROM transactions WHERE id = ?`, [id]);
}

// ─── Update ───────────────────────────────────────────────────────────────────
export function updateTransaction(id: number, data: NewTransaction): void {
  getDb().runSync(
    `UPDATE transactions
     SET type = ?, amount = ?, category = ?, note = ?, date = ?
     WHERE id = ?`,
    [data.type, data.amount, data.category, data.note ?? "", data.date, id]
  );
}

// ─── Get all (untuk export) ───────────────────────────────────────────────────
export function getAllTransactions(): Transaction[] {
  try {
    const rows = getDb().getAllSync(
      `SELECT id, type, amount, category, note, date, created_at
       FROM transactions ORDER BY date DESC, created_at DESC`
    ) as any[];

    return rows.map((row) => ({
      id: Number(row.id),
      type: String(row.type) as TransactionType,
      amount: Number(row.amount),
      category: String(row.category),
      note: String(row.note ?? ""),
      date: String(row.date),
      created_at: String(row.created_at),
    }));
  } catch (e) {
    console.error("❌ getAllTransactions error:", e);
    return [];
  }
}
