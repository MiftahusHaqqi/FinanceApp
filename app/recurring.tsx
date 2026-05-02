import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getAllRecurring,
  insertRecurring,
  updateRecurring,
  deleteRecurring,
  toggleRecurring,
  RecurringTransaction,
  NewRecurringTransaction,
  TransactionType,
} from "../database/db";
import { DEFAULT_CATEGORIES, Category } from "../constants/categories";
import { getAllCustomCategories } from "../database/db";
import { formatRupiah } from "../hooks/useTransactions";
import CategoryPicker from "../components/CategoryPicker";

export default function RecurringScreen() {
  const [recurrings, setRecurrings] = useState<RecurringTransaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<RecurringTransaction | null>(null);

  // Form state
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [allCategories, setAllCategories] =
    useState<Category[]>(DEFAULT_CATEGORIES);

  const loadData = useCallback(() => {
    setRecurrings(getAllRecurring());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    try {
      const customs = getAllCustomCategories().map(
        (c): Category => ({ ...c, custom: true })
      );
      setAllCategories([...DEFAULT_CATEGORIES, ...customs]);
    } catch {
      setAllCategories([...DEFAULT_CATEGORIES]);
    }
  }, []); // ← jalan sekali setelah mount

  useEffect(() => {
    if (!showModal) return;
    try {
      const customs = getAllCustomCategories().map(
        (c): Category => ({ ...c, custom: true })
      );
      setAllCategories([...DEFAULT_CATEGORIES, ...customs]);
    } catch {
      setAllCategories([...DEFAULT_CATEGORIES]);
    }
  }, [showModal]);

  const resetForm = () => {
    setType("expense");
    setAmount("");
    setCategory("food");
    setNote("");
    setDayOfMonth("1");
    setEditItem(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item: RecurringTransaction) => {
    setEditItem(item);
    setType(item.type);
    setAmount(String(Math.round(item.amount)));
    setCategory(item.category);
    setNote(item.note);
    setDayOfMonth(String(item.day_of_month));
    setShowModal(true);
  };

  const handleSave = () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Perhatian", "Masukkan jumlah yang valid.");
      return;
    }
    const day = Number(dayOfMonth);
    if (!day || day < 1 || day > 31) {
      Alert.alert("Perhatian", "Tanggal harus antara 1 - 31.");
      return;
    }

    const data: NewRecurringTransaction = {
      type,
      amount: Number(amount),
      category,
      note: note.trim(),
      day_of_month: day,
    };

    if (editItem) {
      updateRecurring(editItem.id, data);
    } else {
      insertRecurring(data);
    }

    setShowModal(false);
    resetForm();
    loadData();
  };

  const handleDelete = (item: RecurringTransaction) => {
    const cat =
      allCategories.find((c) => c.id === item.category) ??
      allCategories[allCategories.length - 1];
    Alert.alert(
      "Hapus Recurring",
      `Hapus "${
        item.note || cat.label
      }"? Transaksi yang sudah dibuat tidak akan terhapus.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            deleteRecurring(item.id);
            loadData();
          },
        },
      ]
    );
  };

  const handleToggle = (item: RecurringTransaction) => {
    toggleRecurring(item.id, item.is_active === 0);
    loadData();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaksi Rutin</Text>
        <Text style={styles.headerSub}>
          Otomatis dicatat setiap bulan pada tanggal yang ditentukan
        </Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {recurrings.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔁</Text>
            <Text style={styles.emptyText}>Belum ada transaksi rutin</Text>
            <Text style={styles.emptySubText}>
              Tambahkan gaji, cicilan, langganan, atau tagihan bulanan
            </Text>
          </View>
        ) : (
          recurrings.map((item) => {
            const cat =
              allCategories.find((c) => c.id === item.category) ??
              allCategories[allCategories.length - 1];
            const isActive = item.is_active === 1;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, !isActive && styles.cardInactive]}
                onPress={() => openEdit(item)}
                onLongPress={() => handleDelete(item)}
                activeOpacity={0.8}
              >
                {/* Ikon */}
                <View style={[styles.cardIcon, { backgroundColor: cat.bg }]}>
                  <Text style={styles.cardIconTxt}>{cat.icon}</Text>
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.note || cat.label}
                  </Text>
                  <Text style={styles.cardSub}>
                    {cat.label} · setiap tgl {item.day_of_month}
                  </Text>
                </View>

                {/* Kanan */}
                <View style={styles.cardRight}>
                  <Text
                    style={[
                      styles.cardAmount,
                      item.type === "income"
                        ? styles.incomeColor
                        : styles.expenseColor,
                    ]}
                  >
                    {item.type === "income" ? "+" : "-"}
                    {formatRupiah(item.amount)}
                  </Text>
                  <Switch
                    value={isActive}
                    onValueChange={() => handleToggle(item)}
                    trackColor={{ false: "#ddd", true: "#A29BFE" }}
                    thumbColor={isActive ? "#6C5CE7" : "#fff"}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Text style={styles.fabTxt}>+</Text>
      </TouchableOpacity>

      {/* ── Modal form ── */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <SafeAreaView style={styles.modalSafe} edges={["top"]}>
          {/* Header modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editItem ? "Edit Transaksi Rutin" : "Tambah Transaksi Rutin"}
            </Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Toggle tipe */}
            <View style={styles.toggle}>
              {(["expense", "income"] as TransactionType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.toggleBtn, type === t && styles.toggleActive]}
                  onPress={() => {
                    setType(t);
                    const firstCat = allCategories.find(
                      (c) => c.type === t || c.type === "both"
                    );
                    setCategory(firstCat?.id ?? "");
                  }}
                >
                  <Text
                    style={[
                      styles.toggleTxt,
                      type === t && styles.toggleTxtActive,
                    ]}
                  >
                    {t === "expense" ? "▼ Pengeluaran" : "▲ Pemasukan"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Jumlah */}
            <Text style={styles.label}>Jumlah</Text>
            <View style={styles.amountWrap}>
              <Text style={styles.currency}>Rp</Text>
              <TextInput
                style={styles.amountInput}
                value={
                  amount
                    ? new Intl.NumberFormat("id-ID").format(Number(amount))
                    : ""
                }
                onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#ccc"
              />
            </View>

            {/* Kategori */}
            <Text style={styles.label}>Kategori</Text>
            <CategoryPicker
              type={type}
              selected={category}
              onSelect={setCategory}
              categories={allCategories.filter(
                (c) => c.type === type || c.type === "both"
              )}
            />

            {/* Nama / catatan */}
            <Text style={[styles.label, { marginTop: 16 }]}>
              Nama <Text style={styles.optional}>(opsional)</Text>
            </Text>
            <TextInput
              style={styles.inputField}
              value={note}
              onChangeText={setNote}
              placeholder="Contoh: Gaji bulanan, Netflix, Cicilan motor..."
              placeholderTextColor="#ccc"
              maxLength={60}
            />

            {/* Tanggal eksekusi */}
            <Text style={styles.label}>Tanggal setiap bulan</Text>
            <View style={styles.dayWrap}>
              <TextInput
                style={styles.dayInput}
                value={dayOfMonth}
                onChangeText={(t) => setDayOfMonth(t.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                maxLength={2}
                placeholder="1"
                placeholderTextColor="#ccc"
              />
              <Text style={styles.dayLabel}>
                Transaksi akan otomatis dibuat setiap tanggal{" "}
                <Text style={{ fontWeight: "700", color: "#6C5CE7" }}>
                  {dayOfMonth || "?"}
                </Text>{" "}
                setiap bulan
              </Text>
            </View>

            {/* Simpan */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveTxt}>
                {editItem ? "Simpan Perubahan" : "Tambah Transaksi Rutin"}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
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
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  body: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 40,
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
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardInactive: {
    opacity: 0.5,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconTxt: {
    fontSize: 18,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  cardSub: {
    fontSize: 12,
    color: "#888",
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  cardAmount: {
    fontSize: 13,
    fontWeight: "600",
  },
  incomeColor: {
    color: "#1B8A4A",
  },
  expenseColor: {
    color: "#C0392B",
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
    elevation: 8,
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabTxt: {
    fontSize: 28,
    color: "#fff",
    lineHeight: 32,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  closeTxt: {
    fontSize: 14,
    color: "#555",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: "#F0EEFF",
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: "#6C5CE7",
  },
  toggleTxt: {
    fontSize: 13,
    color: "#888",
    fontWeight: "500",
  },
  toggleTxtActive: {
    color: "#fff",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#555",
    marginBottom: 8,
  },
  optional: {
    fontWeight: "400",
    color: "#aaa",
  },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F8FF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0DBFF",
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  currency: {
    fontSize: 18,
    fontWeight: "500",
    color: "#6C5CE7",
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    color: "#1A1A2E",
    paddingVertical: 14,
  },
  inputField: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    padding: 12,
    fontSize: 14,
    color: "#333",
    marginBottom: 20,
  },
  dayWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  dayInput: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F9F8FF",
    borderWidth: 1.5,
    borderColor: "#E0DBFF",
    fontSize: 22,
    fontWeight: "700",
    color: "#6C5CE7",
    textAlign: "center",
  },
  dayLabel: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  saveBtn: {
    backgroundColor: "#6C5CE7",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  saveTxt: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
