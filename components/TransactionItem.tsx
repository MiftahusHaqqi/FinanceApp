import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Transaction } from "../database/db";
import { getCategoryById } from "../constants/categories";
import { formatRupiah, formatTime } from "../hooks/useTransactions";

// ─── Props ────────────────────────────────────────────────────────────────────
interface TransactionItemProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: number) => void;
  showDate?: boolean;
}

// ─── Komponen ─────────────────────────────────────────────────────────────────
export default function TransactionItem({
  transaction,
  onEdit,
  onDelete,
  showDate = false,
}: TransactionItemProps) {
  const category = getCategoryById(transaction.category);
  const isIncome = transaction.type === "income";

  // ── Konfirmasi hapus ───────────────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      "Hapus Transaksi",
      `Yakin ingin menghapus "${category.label} - ${formatRupiah(
        transaction.amount
      )}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => onDelete?.(transaction.id),
        },
      ]
    );
  };

  // ── Long press: muncul opsi edit / hapus ──────────────────────────────────
  const handleLongPress = () => {
    Alert.alert(category.label, formatRupiah(transaction.amount), [
      { text: "Batal", style: "cancel" },
      { text: "✏️ Edit", onPress: () => onEdit?.(transaction) },
      { text: "🗑️ Hapus", style: "destructive", onPress: handleDelete },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      {/* Ikon kategori */}
      <View style={[styles.iconWrap, { backgroundColor: category.bg }]}>
        <Text style={styles.icon}>{category.icon}</Text>
      </View>

      {/* Info transaksi */}
      <View style={styles.info}>
        <Text style={styles.categoryLabel} numberOfLines={1}>
          {category.label}
        </Text>
        <Text style={styles.note} numberOfLines={1}>
          {transaction.note
            ? transaction.note
            : showDate
            ? transaction.date.substring(0, 10)
            : formatTime(transaction.date)}
        </Text>
      </View>

      {/* Jumlah */}
      <View style={styles.amountWrap}>
        <Text
          style={[styles.amount, isIncome ? styles.income : styles.expense]}
        >
          {isIncome ? "+" : "-"}
          {formatRupiah(transaction.amount)}
        </Text>
        <Text style={styles.time}>{formatTime(transaction.date)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 18,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  note: {
    fontSize: 12,
    color: "#888",
  },
  amountWrap: {
    alignItems: "flex-end",
    gap: 3,
  },
  amount: {
    fontSize: 14,
    fontWeight: "600",
  },
  income: {
    color: "#1B8A4A",
  },
  expense: {
    color: "#C0392B",
  },
  time: {
    fontSize: 11,
    color: "#aaa",
  },
});
