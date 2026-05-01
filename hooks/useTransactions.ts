import { useState, useEffect, useCallback } from "react";
import {
  getAllTransactions,
  getTransactionsByMonth,
  getMonthlySummary,
  getExpenseByCategory,
  getCategoryBudgets,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
  upsertCategoryBudget,
  setupDatabase,
  Transaction,
  NewTransaction,
  MonthlySummary,
  CategorySummary,
  CategoryBudget,
} from "../database/db";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UseTransactionsReturn {
  // Data
  transactions: Transaction[];
  monthlySummary: MonthlySummary;
  categoryBreakdown: CategorySummary[];
  categoryBudgets: CategoryBudget[];
  isLoading: boolean;

  // Filter bulan aktif
  activeYear: number;
  activeMonth: number;
  setActiveMonth: (year: number, month: number) => void;

  // Actions
  addTransaction: (data: NewTransaction) => Promise<void>;
  editTransaction: (id: number, data: NewTransaction) => Promise<void>;
  removeTransaction: (id: number) => Promise<void>;
  saveCategoryBudget: (category: string, amount: number) => Promise<void>;

  // Refresh manual
  refresh: () => void;
}

// ─── Hook utama ───────────────────────────────────────────────────────────────
export function useTransactions(): UseTransactionsReturn {
  const now = new Date();

  const [activeYear, setActiveYear] = useState(now.getFullYear());
  const [activeMonth, setActiveMonthState] = useState(now.getMonth() + 1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary>({
    total_income: 0,
    total_expense: 0,
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategorySummary[]>(
    []
  );
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Setup database sekali saat pertama kali ──────────────────────────────
  useEffect(() => {
    setupDatabase();
  }, []);

  // ── Load data setiap kali bulan/tahun aktif berubah ──────────────────────
  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      const txs = getTransactionsByMonth(activeYear, activeMonth);
      const summary = getMonthlySummary(activeYear, activeMonth);
      const breakdown = getExpenseByCategory(activeYear, activeMonth);
      const budgets = getCategoryBudgets(activeYear, activeMonth);

      setTransactions(txs);
      setMonthlySummary(summary);
      setCategoryBreakdown(breakdown);
      setCategoryBudgets(budgets);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeYear, activeMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Ganti bulan aktif ────────────────────────────────────────────────────
  const setActiveMonth = useCallback((year: number, month: number) => {
    setActiveYear(year);
    setActiveMonthState(month);
  }, []);

  // ── Tambah transaksi ─────────────────────────────────────────────────────
  const addTransaction = useCallback(
    async (data: NewTransaction) => {
      try {
        insertTransaction(data);
        loadData();
      } catch (error) {
        console.error("Error inserting transaction:", error);
        throw error;
      }
    },
    [loadData]
  );

  // ── Edit transaksi ───────────────────────────────────────────────────────
  const editTransaction = useCallback(
    async (id: number, data: NewTransaction) => {
      try {
        updateTransaction(id, data);
        loadData();
      } catch (error) {
        console.error("Error updating transaction:", error);
        throw error;
      }
    },
    [loadData]
  );

  // ── Hapus transaksi ──────────────────────────────────────────────────────
  const removeTransaction = useCallback(
    async (id: number) => {
      try {
        deleteTransaction(id);
        loadData();
      } catch (error) {
        console.error("Error deleting transaction:", error);
        throw error;
      }
    },
    [loadData]
  );

  const saveCategoryBudget = useCallback(
    async (category: string, amount: number) => {
      try {
        upsertCategoryBudget(activeYear, activeMonth, category, amount);
        loadData();
      } catch (error) {
        console.error("Error saving category budget:", error);
        throw error;
      }
    },
    [activeMonth, activeYear, loadData]
  );

  return {
    transactions,
    monthlySummary,
    categoryBreakdown,
    categoryBudgets,
    isLoading,
    activeYear,
    activeMonth,
    setActiveMonth,
    addTransaction,
    editTransaction,
    removeTransaction,
    saveCategoryBudget,
    refresh: loadData,
  };
}

// ─── Helper: format bulan untuk ditampilkan ───────────────────────────────────
export function formatMonthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

// ─── Helper: format angka ke format Rupiah ────────────────────────────────────
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Helper: format tanggal pendek (29 Apr 2026) ─────────────────────────────
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Helper: format waktu (09:30) ────────────────────────────────────────────
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Helper: group transaksi berdasarkan tanggal ──────────────────────────────
export interface GroupedTransactions {
  date: string;
  dateLabel: string;
  transactions: Transaction[];
}

export function groupTransactionsByDate(
  transactions: Transaction[]
): GroupedTransactions[] {
  const groups: Record<string, Transaction[]> = {};

  transactions.forEach((tx) => {
    const dateKey = tx.date.substring(0, 10); // ambil YYYY-MM-DD
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(tx);
  });

  const today = new Date().toISOString().substring(0, 10);
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .substring(0, 10);

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, txs]) => {
      let dateLabel: string;
      if (date === today) dateLabel = "Hari ini";
      else if (date === yesterday) dateLabel = "Kemarin";
      else {
        dateLabel = new Date(date).toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
      }
      return { date, dateLabel, transactions: txs };
    });
}
