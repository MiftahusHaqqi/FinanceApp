import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useTransactions,
  formatMonthLabel,
  groupTransactionsByDate,
} from "../../hooks/useTransactions";
import TransactionItem from "../../components/TransactionItem";
import AddTransactionScreen from "../add-transaction";
import { Transaction, TransactionType } from "../../database/db";
import { getCategoryById } from "../../constants/categories";

type TypeFilter = "all" | TransactionType;
type DateFilterTarget = "start" | "end";

const WEEKDAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function toDateKey(date: Date): string {
  return date.toISOString().substring(0, 10);
}

function getMonthDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(day);
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

export default function HistoryScreen() {
  const {
    transactions,
    isLoading,
    allCategories,
    activeYear,
    activeMonth,
    setActiveMonth,
    addTransaction,
    editTransaction,
    removeTransaction,
    refresh,
  } = useTransactions();

  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePickerTarget, setDatePickerTarget] =
    useState<DateFilterTarget | null>(null);
  const [calendarYear, setCalendarYear] = useState(activeYear);
  const [calendarMonth, setCalendarMonth] = useState(activeMonth - 1);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      const category =
        allCategories.find((c) => c.id === tx.category) ??
        allCategories[allCategories.length - 1];
      const txDate = tx.date.substring(0, 10);

      const matchesSearch =
        !query ||
        category.label.toLowerCase().includes(query) ||
        tx.category.toLowerCase().includes(query) ||
        tx.note.toLowerCase().includes(query) ||
        String(tx.amount).includes(query);

      const matchesType = typeFilter === "all" || tx.type === typeFilter;
      const matchesStart = !startDate || txDate >= startDate;
      const matchesEnd = !endDate || txDate <= endDate;

      return matchesSearch && matchesType && matchesStart && matchesEnd;
    });
  }, [
    allCategories,
    endDate,
    searchQuery,
    startDate,
    transactions,
    typeFilter,
  ]);

  const grouped = groupTransactionsByDate(filteredTransactions);
  const hasActiveFilter =
    searchQuery.trim() !== "" ||
    typeFilter !== "all" ||
    startDate !== "" ||
    endDate !== "";

  // ── Navigasi bulan ─────────────────────────────────────────────────────────
  const goPrevMonth = () => {
    if (activeMonth === 1) setActiveMonth(activeYear - 1, 12);
    else setActiveMonth(activeYear, activeMonth - 1);
  };

  const goNextMonth = () => {
    const now = new Date();
    if (
      activeYear > now.getFullYear() ||
      (activeYear === now.getFullYear() && activeMonth >= now.getMonth() + 1)
    )
      return; // jangan bisa ke masa depan
    if (activeMonth === 12) setActiveMonth(activeYear + 1, 1);
    else setActiveMonth(activeYear, activeMonth + 1);
  };

  const handleEdit = (tx: Transaction) => {
    setEditItem(tx);
    setShowAdd(true);
  };

  const handleCloseModal = () => {
    setShowAdd(false);
    setEditItem(null);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const openDatePicker = (target: DateFilterTarget) => {
    const selectedDate = target === "start" ? startDate : endDate;
    const sourceDate = selectedDate ? new Date(selectedDate) : new Date();

    setCalendarYear(sourceDate.getFullYear());
    setCalendarMonth(sourceDate.getMonth());
    setDatePickerTarget(target);
  };

  const closeDatePicker = () => {
    setDatePickerTarget(null);
  };

  const goPrevCalendarMonth = () => {
    if (calendarMonth === 0) {
      setCalendarYear(calendarYear - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const goNextCalendarMonth = () => {
    if (calendarMonth === 11) {
      setCalendarYear(calendarYear + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const selectDate = (day: number) => {
    const value = toDateKey(new Date(calendarYear, calendarMonth, day));

    if (datePickerTarget === "start") {
      setStartDate(value);
      if (endDate && value > endDate) setEndDate("");
    } else {
      setEndDate(value);
      if (startDate && value < startDate) setStartDate("");
    }

    closeDatePicker();
  };

  const isCurrentMonth =
    activeYear === new Date().getFullYear() &&
    activeMonth === new Date().getMonth() + 1;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>

        {/* Navigasi bulan */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navBtn} onPress={goPrevMonth}>
            <Text style={styles.navBtnTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {formatMonthLabel(activeYear, activeMonth)}
          </Text>
          <TouchableOpacity
            style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]}
            onPress={goNextMonth}
            disabled={isCurrentMonth}
          >
            <Text
              style={[styles.navBtnTxt, isCurrentMonth && { opacity: 0.3 }]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── List transaksi ── */}
      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        <View style={styles.filterCard}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari catatan, kategori, nominal..."
            placeholderTextColor="#aaa"
          />

          <View style={styles.typeFilterRow}>
            {[
              { label: "Semua", value: "all" },
              { label: "Pemasukan", value: "income" },
              { label: "Pengeluaran", value: "expense" },
            ].map((item) => {
              const isActive = typeFilter === item.value;

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.typeFilterBtn,
                    isActive && styles.typeFilterBtnActive,
                  ]}
                  onPress={() => setTypeFilter(item.value as TypeFilter)}
                >
                  <Text
                    style={[
                      styles.typeFilterText,
                      isActive && styles.typeFilterTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.dateFilterRow}>
            <View style={styles.dateInputWrap}>
              <Text style={styles.dateInputLabel}>Dari</Text>
              <TouchableOpacity
                style={styles.dateSelect}
                onPress={() => openDatePicker("start")}
              >
                <Text
                  style={[
                    styles.dateSelectText,
                    !startDate && styles.dateSelectPlaceholder,
                  ]}
                >
                  {startDate || "Pilih tanggal"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateInputWrap}>
              <Text style={styles.dateInputLabel}>Sampai</Text>
              <TouchableOpacity
                style={styles.dateSelect}
                onPress={() => openDatePicker("end")}
              >
                <Text
                  style={[
                    styles.dateSelectText,
                    !endDate && styles.dateSelectPlaceholder,
                  ]}
                >
                  {endDate || "Pilih tanggal"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterFooter}>
            <Text style={styles.resultCount}>
              {filteredTransactions.length} dari {transactions.length} transaksi
            </Text>
            {hasActiveFilter && (
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Tidak ada transaksi</Text>
            <Text style={styles.emptySubText}>
              Belum ada transaksi di {formatMonthLabel(activeYear, activeMonth)}
            </Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={styles.emptyText}>Tidak ada hasil</Text>
            <Text style={styles.emptySubText}>
              Ubah kata kunci atau filter tanggal untuk melihat transaksi lain
            </Text>
          </View>
        ) : (
          grouped.map((group) => (
            <View key={group.date}>
              {/* Label tanggal */}
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>{group.dateLabel}</Text>
                <View style={styles.dateLine} />
                <Text style={styles.dateTotalTxt}>
                  {group.transactions.length} transaksi
                </Text>
              </View>

              {/* List per hari */}
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

      {/* ── FAB tambah ── */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <Text style={styles.fabTxt}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={datePickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={closeDatePicker}
      >
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.calendarNavBtn}
                onPress={goPrevCalendarMonth}
              >
                <Text style={styles.calendarNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>
                {formatMonthLabel(calendarYear, calendarMonth + 1)}
              </Text>
              <TouchableOpacity
                style={styles.calendarNavBtn}
                onPress={goNextCalendarMonth}
              >
                <Text style={styles.calendarNavText}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label) => (
                <Text key={label} style={styles.weekdayText}>
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {getMonthDays(calendarYear, calendarMonth).map((day, index) => {
                if (!day) {
                  return <View key={`blank-${index}`} style={styles.dayCell} />;
                }

                const value = toDateKey(
                  new Date(calendarYear, calendarMonth, day)
                );
                const isSelected = value === startDate || value === endDate;

                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.dayCell, isSelected && styles.daySelected]}
                    onPress={() => selectDate(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarActions}>
              {datePickerTarget && (
                <TouchableOpacity
                  onPress={() => {
                    if (datePickerTarget === "start") setStartDate("");
                    else setEndDate("");
                    closeDatePicker();
                  }}
                >
                  <Text style={styles.clearDateText}>Hapus</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={closeDatePicker}>
                <Text style={styles.closeCalendarText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal tambah / edit ── */}
      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <AddTransactionScreen
          editTransaction={editItem}
          onSave={async (data) => {
            if (editItem) await editTransaction(editItem.id, data);
            else await addTransaction(data);
            handleCloseModal();
          }}
          onClose={handleCloseModal}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#6C5CE7",
  },
  header: {
    backgroundColor: "#6C5CE7",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  navBtnTxt: {
    fontSize: 22,
    color: "#fff",
    lineHeight: 26,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  body: {
    flex: 1,
    backgroundColor: "#F5F4FF",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  filterCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  searchInput: {
    backgroundColor: "#F9F8FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E6FF",
    color: "#1A1A2E",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typeFilterRow: {
    flexDirection: "row",
    backgroundColor: "#F0EEFF",
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  typeFilterBtn: {
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 9,
  },
  typeFilterBtnActive: {
    backgroundColor: "#6C5CE7",
  },
  typeFilterText: {
    color: "#777",
    fontSize: 12,
    fontWeight: "500",
  },
  typeFilterTextActive: {
    color: "#fff",
  },
  dateFilterRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateInputWrap: {
    flex: 1,
    gap: 6,
  },
  dateInputLabel: {
    color: "#777",
    fontSize: 12,
    fontWeight: "500",
  },
  dateSelect: {
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEE",
    minHeight: 39,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  dateSelectText: {
    color: "#1A1A2E",
    fontSize: 13,
  },
  dateSelectPlaceholder: {
    color: "#bbb",
  },
  filterFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultCount: {
    color: "#888",
    fontSize: 12,
  },
  resetText: {
    color: "#6C5CE7",
    fontSize: 12,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  dateTotalTxt: {
    fontSize: 11,
    color: "#aaa",
  },
  txGroup: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
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
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6C5CE7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabTxt: {
    fontSize: 28,
    color: "#fff",
    lineHeight: 32,
  },
  calendarOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 24,
  },
  calendarCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  calendarNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0EEFF",
  },
  calendarNavText: {
    color: "#6C5CE7",
    fontSize: 22,
    lineHeight: 26,
  },
  calendarTitle: {
    color: "#1A1A2E",
    fontSize: 16,
    fontWeight: "600",
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    color: "#888",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  daySelected: {
    backgroundColor: "#6C5CE7",
  },
  dayText: {
    color: "#333",
    fontSize: 13,
    fontWeight: "500",
  },
  dayTextSelected: {
    color: "#fff",
  },
  calendarActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
    marginTop: 14,
  },
  clearDateText: {
    color: "#C0392B",
    fontSize: 14,
    fontWeight: "600",
  },
  closeCalendarText: {
    color: "#6C5CE7",
    fontSize: 14,
    fontWeight: "600",
  },
});
