import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { formatRupiah } from "../hooks/useTransactions";
import { MonthlySummary } from "../database/db";

interface SummaryCardProps {
  summary: MonthlySummary;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  const balance = summary.total_income - summary.total_expense;
  const isPositive = balance >= 0;

  return (
    <View style={styles.card}>
      {/* Saldo bersih */}
      <Text style={styles.balanceLabel}>Saldo bulan ini</Text>
      <Text
        style={[styles.balance, { color: isPositive ? "#fff" : "#FFD3D3" }]}
      >
        {formatRupiah(balance)}
      </Text>

      {/* Pemasukan & Pengeluaran */}
      <View style={styles.row}>
        <View style={styles.subCard}>
          <Text style={styles.subLabel}>▲ Pemasukan</Text>
          <Text style={styles.subValue}>
            {formatRupiah(summary.total_income)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.subCard}>
          <Text style={styles.subLabel}>▼ Pengeluaran</Text>
          <Text style={styles.subValue}>
            {formatRupiah(summary.total_expense)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  balanceLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  balance: {
    fontSize: 28,
    fontWeight: "600",
    color: "#fff",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: "row",
    marginTop: 14,
    gap: 12,
  },
  subCard: {
    flex: 1,
    gap: 4,
  },
  subLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  subValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#fff",
  },
  divider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});
