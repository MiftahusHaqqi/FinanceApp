import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { NewTransaction, Transaction, TransactionType } from "../database/db";
import CategoryPicker from "../components/CategoryPicker";
import { getCategoriesByType } from "../constants/categories";

interface Props {
  onSave: (data: NewTransaction) => Promise<void>;
  onClose: () => void;
  editTransaction?: Transaction | null;
}

export default function AddTransactionScreen({
  onSave,
  onClose,
  editTransaction,
}: Props) {
  const isEdit = !!editTransaction;

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [isSaving, setIsSaving] = useState(false);

  // ── Isi form jika mode edit ────────────────────────────────────────────────
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(String(editTransaction.amount));
      setCategory(editTransaction.category);
      setNote(editTransaction.note ?? "");
      setDate(editTransaction.date.substring(0, 10));
    }
  }, [editTransaction]);

  // ── Reset kategori saat tipe berubah ──────────────────────────────────────
  useEffect(() => {
    if (!isEdit) {
      const firstCat = getCategoriesByType(type)[0];
      setCategory(firstCat?.id ?? "");
    }
  }, [type]);

  // ── Format input angka ────────────────────────────────────────────────────
  const handleAmountChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, "");
    setAmount(clean);
  };

  const formatDisplayAmount = (val: string) => {
    if (!val) return "";
    return new Intl.NumberFormat("id-ID").format(Number(val));
  };

  // ── Simpan ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Perhatian", "Masukkan jumlah yang valid.");
      return;
    }
    if (!category) {
      Alert.alert("Perhatian", "Pilih kategori terlebih dahulu.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        type,
        amount: Number(amount),
        category,
        note: note.trim(),
        date: `${date}T${new Date().toTimeString().substring(0, 8)}`,
      });
    } catch {
      Alert.alert("Error", "Gagal menyimpan transaksi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEdit ? "Edit Transaksi" : "Tambah Transaksi"}
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Toggle tipe ── */}
          <View style={styles.toggle}>
            {(["expense", "income"] as TransactionType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.toggleBtn, type === t && styles.toggleActive]}
                onPress={() => setType(t)}
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

          {/* ── Input jumlah ── */}
          <Text style={styles.label}>Jumlah</Text>
          <View style={styles.amountWrap}>
            <Text style={styles.currency}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              value={formatDisplayAmount(amount)}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#ccc"
            />
          </View>

          {/* ── Pilih kategori ── */}
          <Text style={styles.label}>Kategori</Text>
          <CategoryPicker
            type={type}
            selected={category}
            onSelect={setCategory}
          />

          {/* ── Catatan ── */}
          <Text style={[styles.label, { marginTop: 16 }]}>
            Catatan <Text style={styles.optional}>(opsional)</Text>
          </Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Tulis catatan..."
            placeholderTextColor="#ccc"
            multiline
            maxLength={100}
          />

          {/* ── Tanggal ── */}
          <Text style={styles.label}>Tanggal</Text>
          <TextInput
            style={styles.dateInput}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#ccc"
            keyboardType="numeric"
            maxLength={10}
          />

          {/* ── Tombol simpan ── */}
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveTxt}>
              {isSaving
                ? "Menyimpan..."
                : isEdit
                ? "Simpan Perubahan"
                : "Simpan Transaksi"}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
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
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  body: {
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
  noteInput: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    padding: 12,
    fontSize: 14,
    color: "#333",
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  dateInput: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    padding: 12,
    fontSize: 14,
    color: "#333",
    marginBottom: 28,
  },
  saveBtn: {
    backgroundColor: "#6C5CE7",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveTxt: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
