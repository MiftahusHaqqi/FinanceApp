import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useTransactions,
  formatMonthLabel,
  formatRupiah,
} from "../../hooks/useTransactions";
import {
  CATEGORIES,
  Category,
  getCategoryById,
  CHART_COLORS,
} from "../../constants/categories";

const { width } = Dimensions.get("window");
const BAR_MAX_WIDTH = width - 120;
const EXPENSE_CATEGORIES = CATEGORIES.filter(
  (category) => category.type === "expense" || category.type === "both"
);

export default function StatisticsScreen() {
  const {
    monthlySummary,
    categoryBreakdown,
    categoryBudgets,
    activeYear,
    activeMonth,
    setActiveMonth,
    saveCategoryBudget,
  } = useTransactions();

  const [selectedBudgetCategory, setSelectedBudgetCategory] =
    useState<Category | null>(null);
  const [budgetAmount, setBudgetAmount] = useState("");

  const balance = monthlySummary.total_income - monthlySummary.total_expense;
  const isPositive = balance >= 0;

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
      return;
    if (activeMonth === 12) setActiveMonth(activeYear + 1, 1);
    else setActiveMonth(activeYear, activeMonth + 1);
  };

  const isCurrentMonth =
    activeYear === new Date().getFullYear() &&
    activeMonth === new Date().getMonth() + 1;

  const maxExpense = categoryBreakdown[0]?.total ?? 1;
  const budgetRows = useMemo(() => {
    return EXPENSE_CATEGORIES.map((category) => {
      const spent =
        categoryBreakdown.find((item) => item.category === category.id)
          ?.total ?? 0;
      const budget =
        categoryBudgets.find((item) => item.category === category.id)?.amount ??
        0;
      const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
      const remaining = budget - spent;

      return {
        category,
        spent,
        budget,
        pct,
        remaining,
        isOver: budget > 0 && spent > budget,
      };
    });
  }, [categoryBreakdown, categoryBudgets]);

  const openBudgetModal = (category: Category, currentBudget: number) => {
    setSelectedBudgetCategory(category);
    setBudgetAmount(currentBudget > 0 ? String(Math.round(currentBudget)) : "");
  };

  const handleBudgetAmountChange = (text: string) => {
    setBudgetAmount(text.replace(/[^0-9]/g, ""));
  };

  const handleSaveBudget = async () => {
    if (!selectedBudgetCategory) return;

    try {
      await saveCategoryBudget(
        selectedBudgetCategory.id,
        budgetAmount ? Number(budgetAmount) : 0
      );
      setSelectedBudgetCategory(null);
      setBudgetAmount("");
    } catch {
      Alert.alert("Gagal", "Budget kategori belum bisa disimpan.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistik</Text>
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

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* ── Ringkasan ── */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: "#E8F5E9" }]}>
            <Text style={styles.summaryLbl}>▲ Pemasukan</Text>
            <Text style={[styles.summaryVal, { color: "#1B8A4A" }]}>
              {formatRupiah(monthlySummary.total_income)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#FFEBEE" }]}>
            <Text style={styles.summaryLbl}>▼ Pengeluaran</Text>
            <Text style={[styles.summaryVal, { color: "#C0392B" }]}>
              {formatRupiah(monthlySummary.total_expense)}
            </Text>
          </View>
        </View>

        {/* ── Saldo bersih ── */}
        <View
          style={[
            styles.balanceCard,
            { backgroundColor: isPositive ? "#6C5CE7" : "#E17055" },
          ]}
        >
          <Text style={styles.balanceLbl}>Saldo Bersih</Text>
          <Text style={styles.balanceVal}>{formatRupiah(balance)}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitleNoMargin}>Budget Kategori</Text>
            <Text style={styles.sectionHint}>Tap kategori untuk atur</Text>
          </View>

          {budgetRows.map((row) => (
            <TouchableOpacity
              key={row.category.id}
              style={styles.budgetRow}
              activeOpacity={0.75}
              onPress={() => openBudgetModal(row.category, row.budget)}
            >
              <View style={styles.budgetTopRow}>
                <View style={styles.budgetCategoryInfo}>
                  <View
                    style={[
                      styles.budgetIconWrap,
                      { backgroundColor: row.category.bg },
                    ]}
                  >
                    <Text style={styles.budgetIcon}>{row.category.icon}</Text>
                  </View>
                  <View style={styles.budgetTextWrap}>
                    <Text style={styles.budgetCategoryLabel}>
                      {row.category.label}
                    </Text>
                    <Text style={styles.budgetSpentText}>
                      {formatRupiah(row.spent)} terpakai
                    </Text>
                  </View>
                </View>
                <Text style={styles.budgetAmountText}>
                  {row.budget > 0 ? formatRupiah(row.budget) : "Atur"}
                </Text>
              </View>

              <View style={styles.budgetProgressBg}>
                <View
                  style={[
                    styles.budgetProgressFill,
                    {
                      width: `${row.pct}%`,
                      backgroundColor: row.isOver ? "#C0392B" : "#6C5CE7",
                    },
                  ]}
                />
              </View>

              <View style={styles.budgetBottomRow}>
                <Text
                  style={[
                    styles.budgetRemainingText,
                    row.isOver && styles.budgetOverText,
                  ]}
                >
                  {row.budget > 0
                    ? row.isOver
                      ? `Melebihi ${formatRupiah(Math.abs(row.remaining))}`
                      : `Sisa ${formatRupiah(row.remaining)}`
                    : "Belum ada budget"}
                </Text>
                <Text style={styles.budgetPctText}>
                  {row.budget > 0 ? `${Math.round(row.pct)}%` : "0%"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Breakdown kategori ── */}
        {categoryBreakdown.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>Belum ada data pengeluaran</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pengeluaran per Kategori</Text>

            {categoryBreakdown.map((item, index) => {
              const cat = getCategoryById(item.category);
              const barWidth = (item.total / maxExpense) * BAR_MAX_WIDTH;
              const color = CHART_COLORS[index % CHART_COLORS.length];
              const pct =
                monthlySummary.total_expense > 0
                  ? ((item.total / monthlySummary.total_expense) * 100).toFixed(
                      1
                    )
                  : "0";

              return (
                <View key={item.category} style={styles.barRow}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barIcon}>{cat.icon}</Text>
                    <Text style={styles.barLabel}>{cat.label}</Text>
                    <Text style={styles.barPct}>{pct}%</Text>
                    <Text style={styles.barVal}>
                      {formatRupiah(item.total)}
                    </Text>
                  </View>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        { width: barWidth, backgroundColor: color },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Legend donut ── */}
        {categoryBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proporsi Pengeluaran</Text>
            <View style={styles.legendWrap}>
              {categoryBreakdown.map((item, index) => {
                const cat = getCategoryById(item.category);
                const color = CHART_COLORS[index % CHART_COLORS.length];
                const pct =
                  monthlySummary.total_expense > 0
                    ? (
                        (item.total / monthlySummary.total_expense) *
                        100
                      ).toFixed(1)
                    : "0";
                return (
                  <View key={item.category} style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: color }]}
                    />
                    <Text style={styles.legendIcon}>{cat.icon}</Text>
                    <Text style={styles.legendLabel}>{cat.label}</Text>
                    <Text style={styles.legendPct}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal
        visible={selectedBudgetCategory !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBudgetCategory(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.budgetModalCard}>
            <Text style={styles.modalTitle}>
              Budget {selectedBudgetCategory?.label}
            </Text>
            <Text style={styles.modalSubtitle}>
              {formatMonthLabel(activeYear, activeMonth)}
            </Text>

            <View style={styles.amountInputWrap}>
              <Text style={styles.currencyText}>Rp</Text>
              <TextInput
                style={styles.budgetInput}
                value={
                  budgetAmount
                    ? new Intl.NumberFormat("id-ID").format(
                        Number(budgetAmount)
                      )
                    : ""
                }
                onChangeText={handleBudgetAmountChange}
                placeholder="0"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setSelectedBudgetCategory(null);
                  setBudgetAmount("");
                }}
              >
                <Text style={styles.modalSecondaryText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={handleSaveBudget}
              >
                <Text style={styles.modalPrimaryText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  summaryLbl: {
    fontSize: 12,
    color: "#555",
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: "600",
  },
  balanceCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    gap: 4,
  },
  balanceLbl: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  balanceVal: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  sectionTitleNoMargin: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  sectionHint: {
    fontSize: 11,
    color: "#999",
  },
  budgetRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  budgetTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  budgetCategoryInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  budgetIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  budgetIcon: {
    fontSize: 17,
  },
  budgetTextWrap: {
    flex: 1,
    gap: 2,
  },
  budgetCategoryLabel: {
    color: "#1A1A2E",
    fontSize: 13,
    fontWeight: "600",
  },
  budgetSpentText: {
    color: "#888",
    fontSize: 12,
  },
  budgetAmountText: {
    color: "#6C5CE7",
    fontSize: 12,
    fontWeight: "700",
  },
  budgetProgressBg: {
    height: 8,
    backgroundColor: "#F0EEFF",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 7,
  },
  budgetProgressFill: {
    height: 8,
    borderRadius: 4,
  },
  budgetBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetRemainingText: {
    color: "#1B8A4A",
    fontSize: 12,
    fontWeight: "500",
  },
  budgetOverText: {
    color: "#C0392B",
  },
  budgetPctText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  barRow: {
    marginBottom: 12,
  },
  barLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  barIcon: {
    fontSize: 14,
  },
  barLabel: {
    flex: 1,
    fontSize: 13,
    color: "#333",
  },
  barPct: {
    fontSize: 12,
    color: "#888",
  },
  barVal: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
    minWidth: 80,
    textAlign: "right",
  },
  barBg: {
    height: 8,
    backgroundColor: "#F0EEFF",
    borderRadius: 4,
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  legendWrap: {
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendIcon: {
    fontSize: 14,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    color: "#333",
  },
  legendPct: {
    fontSize: 13,
    fontWeight: "500",
    color: "#555",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 14,
    color: "#aaa",
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 24,
  },
  budgetModalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    color: "#1A1A2E",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalSubtitle: {
    color: "#888",
    fontSize: 13,
    marginBottom: 16,
  },
  amountInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F8FF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0DBFF",
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  currencyText: {
    color: "#6C5CE7",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    color: "#1A1A2E",
    fontSize: 22,
    fontWeight: "700",
    paddingVertical: 14,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalSecondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  modalPrimaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#6C5CE7",
  },
  modalSecondaryText: {
    color: "#555",
    fontSize: 13,
    fontWeight: "600",
  },
  modalPrimaryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
