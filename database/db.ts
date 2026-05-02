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

  database.execSync(`
  CREATE TABLE IF NOT EXISTS recurring_transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL,
    amount      REAL NOT NULL,
    category    TEXT NOT NULL,
    note        TEXT DEFAULT '',
    day_of_month INTEGER NOT NULL DEFAULT 1,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  )
`);

  database.execSync(`
  CREATE TABLE IF NOT EXISTS recurring_logs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    recurring_id INTEGER NOT NULL,
    year         INTEGER NOT NULL,
    month        INTEGER NOT NULL,
    transaction_id INTEGER,
    executed_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    UNIQUE(recurring_id, year, month)
  )
`);

  database.execSync(`
  CREATE TABLE IF NOT EXISTS custom_categories (
    id         TEXT PRIMARY KEY,
    label      TEXT NOT NULL,
    icon       TEXT NOT NULL DEFAULT '📌',
    color      TEXT NOT NULL DEFAULT '#546E7A',
    bg         TEXT NOT NULL DEFAULT '#ECEFF1',
    type       TEXT NOT NULL DEFAULT 'both',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
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

// ─── Recurring Transaction Types ─────────────────────────────────────────────
export interface RecurringTransaction {
  id: number;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  day_of_month: number;
  is_active: number;
  created_at: string;
}

export interface NewRecurringTransaction {
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  day_of_month: number;
}

// ─── Ambil semua recurring ────────────────────────────────────────────────────
export function getAllRecurring(): RecurringTransaction[] {
  try {
    const rows = getDb().getAllSync(
      `SELECT id, type, amount, category, note, day_of_month, is_active, created_at
       FROM recurring_transactions
       ORDER BY day_of_month ASC`
    ) as any[];

    return rows.map((row) => ({
      id: Number(row.id),
      type: String(row.type) as TransactionType,
      amount: Number(row.amount),
      category: String(row.category),
      note: String(row.note ?? ""),
      day_of_month: Number(row.day_of_month),
      is_active: Number(row.is_active),
      created_at: String(row.created_at),
    }));
  } catch (e) {
    console.error("getAllRecurring error:", e);
    return [];
  }
}

// ─── Tambah recurring ─────────────────────────────────────────────────────────
export function insertRecurring(data: NewRecurringTransaction): void {
  getDb().runSync(
    `INSERT INTO recurring_transactions (type, amount, category, note, day_of_month)
     VALUES (?, ?, ?, ?, ?)`,
    [data.type, data.amount, data.category, data.note ?? "", data.day_of_month]
  );
}

// ─── Update recurring ─────────────────────────────────────────────────────────
export function updateRecurring(
  id: number,
  data: NewRecurringTransaction
): void {
  getDb().runSync(
    `UPDATE recurring_transactions
     SET type = ?, amount = ?, category = ?, note = ?, day_of_month = ?
     WHERE id = ?`,
    [
      data.type,
      data.amount,
      data.category,
      data.note ?? "",
      data.day_of_month,
      id,
    ]
  );
}

// ─── Toggle aktif/nonaktif ────────────────────────────────────────────────────
export function toggleRecurring(id: number, isActive: boolean): void {
  getDb().runSync(
    `UPDATE recurring_transactions SET is_active = ? WHERE id = ?`,
    [isActive ? 1 : 0, id]
  );
}

// ─── Hapus recurring ──────────────────────────────────────────────────────────
export function deleteRecurring(id: number): void {
  getDb().runSync(`DELETE FROM recurring_transactions WHERE id = ?`, [id]);
  getDb().runSync(`DELETE FROM recurring_logs WHERE recurring_id = ?`, [id]);
}

// ─── Cek apakah recurring sudah dijalankan bulan ini ─────────────────────────
export function isRecurringExecutedThisMonth(
  recurringId: number,
  year: number,
  month: number
): boolean {
  try {
    const row = getDb().getFirstSync(
      `SELECT id FROM recurring_logs
       WHERE recurring_id = ? AND year = ? AND month = ?`,
      [recurringId, year, month]
    ) as any;
    return !!row;
  } catch (e) {
    return false;
  }
}

// ─── Jalankan semua recurring yang belum dieksekusi bulan ini ─────────────────
export function executeRecurringTransactions(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.getDate();

  const recurrings = getAllRecurring().filter((r) => r.is_active === 1);
  let executedCount = 0;

  for (const recurring of recurrings) {
    // Skip jika tanggal belum tiba bulan ini
    if (today < recurring.day_of_month) continue;

    // Skip jika sudah dieksekusi bulan ini
    if (isRecurringExecutedThisMonth(recurring.id, year, month)) continue;

    // Buat tanggal transaksi
    const maxDay = new Date(year, month, 0).getDate();
    const execDay = Math.min(recurring.day_of_month, maxDay);
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
      execDay
    ).padStart(2, "0")}T00:00:00`;

    try {
      // Insert transaksi
      getDb().runSync(
        `INSERT INTO transactions (type, amount, category, note, date)
         VALUES (?, ?, ?, ?, ?)`,
        [
          recurring.type,
          recurring.amount,
          recurring.category,
          recurring.note,
          dateStr,
        ]
      );

      // Ambil id transaksi yang baru dibuat
      const newTx = getDb().getFirstSync(
        `SELECT id FROM transactions ORDER BY id DESC LIMIT 1`
      ) as any;

      // Catat di log
      getDb().runSync(
        `INSERT OR IGNORE INTO recurring_logs (recurring_id, year, month, transaction_id)
         VALUES (?, ?, ?, ?)`,
        [recurring.id, year, month, newTx?.id ?? null]
      );

      executedCount++;
      console.log(
        `✅ Recurring executed: ${recurring.note || recurring.category}`
      );
    } catch (e) {
      console.error(`❌ Recurring error (id=${recurring.id}):`, e);
    }
  }

  return executedCount;
}

// ─── Custom Categories ────────────────────────────────────────────────────────
export interface CustomCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  type: "expense" | "income" | "both";
  created_at: string;
}

export interface NewCustomCategory {
  label: string;
  icon: string;
  color: string;
  bg: string;
  type: "expense" | "income" | "both";
}

export function getAllCustomCategories(): CustomCategory[] {
  try {
    const rows = getDb().getAllSync(
      `SELECT id, label, icon, color, bg, type, created_at
       FROM custom_categories
       ORDER BY created_at ASC`
    ) as any[];
    return rows.map((row) => ({
      id: String(row.id),
      label: String(row.label),
      icon: String(row.icon),
      color: String(row.color),
      bg: String(row.bg),
      type: String(row.type) as "expense" | "income" | "both",
      created_at: String(row.created_at),
    }));
  } catch (e) {
    console.error("getAllCustomCategories error:", e);
    return [];
  }
}

export function insertCustomCategory(data: NewCustomCategory): string {
  const id = `custom_${Date.now()}`;
  getDb().runSync(
    `INSERT INTO custom_categories (id, label, icon, color, bg, type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.label, data.icon, data.color, data.bg, data.type]
  );
  return id;
}

export function updateCustomCategory(
  id: string,
  data: NewCustomCategory
): void {
  getDb().runSync(
    `UPDATE custom_categories
     SET label = ?, icon = ?, color = ?, bg = ?, type = ?
     WHERE id = ?`,
    [data.label, data.icon, data.color, data.bg, data.type, id]
  );
}

export function deleteCustomCategory(id: string): void {
  getDb().runSync(`DELETE FROM custom_categories WHERE id = ?`, [id]);
}
