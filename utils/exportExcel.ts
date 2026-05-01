import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { utils, write } from "xlsx";
import { Transaction } from "../database/db";
import { getCategoryById } from "../constants/categories";
import { formatMonthLabel } from "../hooks/useTransactions";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount);
}

async function saveAndShare(
  base64: string,
  fileName: string,
  dialogTitle: string
): Promise<void> {
  const fileUri = String(FileSystem.cacheDirectory) + fileName;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare)
    throw new Error("Fitur berbagi tidak tersedia di perangkat ini.");

  await Sharing.shareAsync(fileUri, {
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    dialogTitle,
    UTI: "com.microsoft.excel.xlsx",
  });
}

// ─── Export satu bulan ────────────────────────────────────────────────────────
export async function exportToExcel(
  transactions: Transaction[],
  year: number,
  month: number
): Promise<void> {
  const rows = transactions.map((tx) => {
    const category = getCategoryById(tx.category);
    const date = new Date(tx.date);
    return {
      Tanggal: date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      Waktu: date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      Tipe: tx.type === "income" ? "Pemasukan" : "Pengeluaran",
      Kategori: category.label,
      Catatan: tx.note || "-",
      "Jumlah (Rp)": toRupiah(tx.amount),
    };
  });

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  rows.push({} as any);
  rows.push({
    Tanggal: "",
    Waktu: "",
    Tipe: "",
    Kategori: "",
    Catatan: "Total Pemasukan",
    "Jumlah (Rp)": toRupiah(totalIncome),
  });
  rows.push({
    Tanggal: "",
    Waktu: "",
    Tipe: "",
    Kategori: "",
    Catatan: "Total Pengeluaran",
    "Jumlah (Rp)": toRupiah(totalExpense),
  });
  rows.push({
    Tanggal: "",
    Waktu: "",
    Tipe: "",
    Kategori: "",
    Catatan: "Saldo Bersih",
    "Jumlah (Rp)": toRupiah(totalIncome - totalExpense),
  });

  const ws = utils.json_to_sheet(rows);
  const wb = utils.book_new();
  const sheetName = formatMonthLabel(year, month).replace(" ", "_");
  utils.book_append_sheet(wb, ws, sheetName);
  ws["!cols"] = [
    { wch: 22 },
    { wch: 8 },
    { wch: 12 },
    { wch: 14 },
    { wch: 28 },
    { wch: 16 },
  ];

  const base64: string = write(wb, { type: "base64", bookType: "xlsx" });
  const monthLabel = formatMonthLabel(year, month).replace(" ", "_");
  await saveAndShare(
    base64,
    `Keuangan_${monthLabel}.xlsx`,
    `Export ${monthLabel}`
  );
}

// ─── Export semua transaksi ───────────────────────────────────────────────────
export async function exportAllToExcel(
  transactions: Transaction[]
): Promise<void> {
  const rows = transactions.map((tx) => {
    const category = getCategoryById(tx.category);
    const date = new Date(tx.date);
    return {
      Tanggal: date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      Waktu: date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      Tipe: tx.type === "income" ? "Pemasukan" : "Pengeluaran",
      Kategori: category.label,
      Catatan: tx.note || "-",
      "Jumlah (Rp)": toRupiah(tx.amount),
    };
  });

  const ws = utils.json_to_sheet(rows);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Semua Transaksi");
  ws["!cols"] = [
    { wch: 22 },
    { wch: 8 },
    { wch: 12 },
    { wch: 14 },
    { wch: 28 },
    { wch: 16 },
  ];

  const base64: string = write(wb, { type: "base64", bookType: "xlsx" });
  await saveAndShare(base64, "Semua_Transaksi.xlsx", "Export Semua Transaksi");
}
