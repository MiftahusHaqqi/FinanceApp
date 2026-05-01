import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useTransactions,
  formatMonthLabel,
  groupTransactionsByDate,
} from "../../hooks/useTransactions";
import SummaryCard from "../../components/SummaryCard";
import TransactionItem from "../../components/TransactionItem";
import AddTransactionScreen from "../add-transaction";
import { Transaction } from "../../database/db";

export default function DashboardScreen() {
  const {
    transactions,
    monthlySummary,
    isLoading,
    activeYear,
    activeMonth,
    addTransaction,
    editTransaction,
    removeTransaction,
    refresh,
  } = useTransactions();

  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Transaction | null>(null);

  const grouped = groupTransactionsByDate(transactions);

  const handleEdit = (tx: Transaction) => {
    setEditItem(tx);
    setShowAdd(true);
  };

  const handleCloseModal = () => {
    setShowAdd(false);
    setEditItem(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Selamat datang 👋</Text>
          <Text style={styles.monthLabel}>
            {formatMonthLabel(activeYear, activeMonth)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAdd(true)}
        >
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* ── Summary Card ── */}
      <View style={styles.headerBg}>
        <SummaryCard summary={monthlySummary} />
      </View>

      {/* ── Transaksi terbaru ── */}
      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>

        {transactions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Belum ada transaksi bulan ini</Text>
            <Text style={styles.emptySubText}>
              Tap "+ Tambah" untuk mencatat transaksi pertama
            </Text>
          </View>
        ) : (
          grouped.map((group) => (
            <View key={group.date}>
              {/* Label tanggal */}
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>{group.dateLabel}</Text>
                <View style={styles.dateLine} />
              </View>

              {/* List transaksi per hari */}
              <View style={styles.txGroup}>
                {group.transactions.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    onEdit={handleEdit}
                    onDelete={removeTransaction}
                  />
                ))}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Modal tambah / edit transaksi ── */}
      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <AddTransactionScreen
          editTransaction={editItem}
          onSave={async (data) => {
            if (editItem) {
              await editTransaction(editItem.id, data);
            } else {
              await addTransaction(data);
            }
            handleCloseModal();
          }}
          onClose={handleCloseModal}
        />
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#6C5CE7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  addBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  headerBg: {
    backgroundColor: "#6C5CE7",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  body: {
    flex: 1,
    backgroundColor: "#F5F4FF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A2E",
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    marginTop: 8,
  },
  dateLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E8E6FF",
  },
  txGroup: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#555",
  },
  emptySubText: {
    fontSize: 13,
    color: "#aaa",
    textAlign: "center",
  },
});
