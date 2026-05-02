import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getAllCustomCategories,
  insertCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
  CustomCategory,
  NewCustomCategory,
} from "../database/db";
import { DEFAULT_CATEGORIES } from "../constants/categories";

// ─── Pilihan ikon ─────────────────────────────────────────────────────────────
const ICON_OPTIONS = [
  "🛒",
  "🚗",
  "🏥",
  "🎮",
  "👗",
  "🏠",
  "📚",
  "💼",
  "🎁",
  "📈",
  "📌",
  "🍜",
  "☕",
  "🎬",
  "💊",
  "✈️",
  "🏋️",
  "🐶",
  "💇",
  "🎓",
  "🏦",
  "💡",
  "📱",
  "💻",
  "🎵",
  "⚽",
  "🏖️",
  "🎂",
  "🍕",
  "🚌",
  "⛽",
  "🔧",
  "🧾",
  "💰",
  "🪴",
  "👶",
  "💍",
  "🎯",
  "🧴",
  "📦",
  "🏪",
  "🎪",
  "🐟",
  "🌿",
];

// ─── Pilihan warna ────────────────────────────────────────────────────────────
const COLOR_OPTIONS = [
  { color: "#2E7D32", bg: "#E8F5E9" },
  { color: "#E65100", bg: "#FFF3E0" },
  { color: "#C62828", bg: "#FFEBEE" },
  { color: "#6A1B9A", bg: "#F3E5F5" },
  { color: "#AD1457", bg: "#FCE4EC" },
  { color: "#4527A0", bg: "#EDE7F6" },
  { color: "#1565C0", bg: "#E3F2FD" },
  { color: "#00695C", bg: "#E0F2F1" },
  { color: "#F57F17", bg: "#FFFDE7" },
  { color: "#546E7A", bg: "#ECEFF1" },
  { color: "#6C5CE7", bg: "#EEEDFE" },
  { color: "#E17055", bg: "#FFF0ED" },
  { color: "#0984E3", bg: "#E3F4FF" },
  { color: "#00B894", bg: "#E0FFF8" },
  { color: "#D63031", bg: "#FFE9E9" },
  { color: "#A29BFE", bg: "#F0EEFF" },
];

type CategoryType = "expense" | "income" | "both";

export default function CategoryManagerScreen() {
  const [customs, setCustoms] = useState<CustomCategory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<CustomCategory | null>(null);

  // Form state
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("📌");
  const [colorPair, setColorPair] = useState(COLOR_OPTIONS[9]);
  const [catType, setCatType] = useState<CategoryType>("expense");

  const loadData = useCallback(() => {
    setCustoms(getAllCustomCategories());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setLabel("");
    setIcon("📌");
    setColorPair(COLOR_OPTIONS[9]);
    setCatType("expense");
    setEditItem(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item: CustomCategory) => {
    setEditItem(item);
    setLabel(item.label);
    setIcon(item.icon);
    setCatType(item.type);
    const found = COLOR_OPTIONS.find((c) => c.color === item.color);
    setColorPair(found ?? { color: item.color, bg: item.bg });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!label.trim()) {
      Alert.alert("Perhatian", "Nama kategori tidak boleh kosong.");
      return;
    }

    const data: NewCustomCategory = {
      label: label.trim(),
      icon,
      color: colorPair.color,
      bg: colorPair.bg,
      type: catType,
    };

    if (editItem) {
      updateCustomCategory(editItem.id, data);
    } else {
      insertCustomCategory(data);
    }

    setShowModal(false);
    resetForm();
    loadData();
  };

  const handleDelete = (item: CustomCategory) => {
    Alert.alert(
      "Hapus Kategori",
      `Hapus kategori "${item.label}"? Transaksi yang sudah menggunakan kategori ini tidak akan terhapus.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            deleteCustomCategory(item.id);
            loadData();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kelola Kategori</Text>
        <Text style={styles.headerSub}>
          Tambah kategori custom sesuai kebutuhanmu
        </Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* ── Kategori bawaan ── */}
        <Text style={styles.sectionLabel}>Kategori Bawaan</Text>
        <View style={styles.card}>
          {DEFAULT_CATEGORIES.map((cat, index) => (
            <View
              key={cat.id}
              style={[
                styles.catRow,
                index < DEFAULT_CATEGORIES.length - 1 && styles.catRowBorder,
              ]}
            >
              <View style={[styles.catIcon, { backgroundColor: cat.bg }]}>
                <Text style={styles.catIconTxt}>{cat.icon}</Text>
              </View>
              <View style={styles.catInfo}>
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={styles.catType}>
                  {cat.type === "expense"
                    ? "Pengeluaran"
                    : cat.type === "income"
                    ? "Pemasukan"
                    : "Keduanya"}
                </Text>
              </View>
              <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
                <Text style={[styles.catBadgeTxt, { color: cat.color }]}>
                  Bawaan
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Kategori custom ── */}
        <Text style={styles.sectionLabel}>Kategori Custom</Text>

        {customs.length === 0 ? (
          <View style={styles.emptyCustom}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyText}>Belum ada kategori custom</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {customs.map((cat, index) => (
              <View
                key={cat.id}
                style={[
                  styles.catRow,
                  index < customs.length - 1 && styles.catRowBorder,
                ]}
              >
                <View style={[styles.catIcon, { backgroundColor: cat.bg }]}>
                  <Text style={styles.catIconTxt}>{cat.icon}</Text>
                </View>
                <View style={styles.catInfo}>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                  <Text style={styles.catType}>
                    {cat.type === "expense"
                      ? "Pengeluaran"
                      : cat.type === "income"
                      ? "Pemasukan"
                      : "Keduanya"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEdit(cat)}
                >
                  <Text style={styles.editBtnTxt}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(cat)}
                >
                  <Text style={styles.deleteBtnTxt}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
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
              {editItem ? "Edit Kategori" : "Tambah Kategori"}
            </Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Preview */}
            <View style={styles.previewWrap}>
              <View
                style={[styles.previewIcon, { backgroundColor: colorPair.bg }]}
              >
                <Text style={styles.previewIconTxt}>{icon}</Text>
              </View>
              <Text style={[styles.previewLabel, { color: colorPair.color }]}>
                {label || "Nama Kategori"}
              </Text>
            </View>

            {/* Nama */}
            <Text style={styles.label}>Nama Kategori</Text>
            <TextInput
              style={styles.inputField}
              value={label}
              onChangeText={setLabel}
              placeholder="Contoh: Olahraga, Pet, Hobi..."
              placeholderTextColor="#ccc"
              maxLength={24}
            />

            {/* Tipe */}
            <Text style={styles.label}>Tipe</Text>
            <View style={styles.toggle}>
              {(
                [
                  { val: "expense", label: "▼ Pengeluaran" },
                  { val: "income", label: "▲ Pemasukan" },
                  { val: "both", label: "↕ Keduanya" },
                ] as { val: CategoryType; label: string }[]
              ).map((t) => (
                <TouchableOpacity
                  key={t.val}
                  style={[
                    styles.toggleBtn,
                    catType === t.val && styles.toggleActive,
                  ]}
                  onPress={() => setCatType(t.val)}
                >
                  <Text
                    style={[
                      styles.toggleTxt,
                      catType === t.val && styles.toggleTxtActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pilih ikon */}
            <Text style={styles.label}>Pilih Ikon</Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[
                    styles.iconOption,
                    icon === ic && {
                      borderColor: colorPair.color,
                      backgroundColor: colorPair.bg,
                    },
                  ]}
                  onPress={() => setIcon(ic)}
                >
                  <Text style={styles.iconOptionTxt}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pilih warna */}
            <Text style={styles.label}>Pilih Warna</Text>
            <View style={styles.colorGrid}>
              {COLOR_OPTIONS.map((pair, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.colorOption,
                    { backgroundColor: pair.color },
                    colorPair.color === pair.color && styles.colorOptionActive,
                  ]}
                  onPress={() => setColorPair(pair)}
                >
                  {colorPair.color === pair.color && (
                    <Text style={styles.colorCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Simpan */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveTxt}>
                {editItem ? "Simpan Perubahan" : "Tambah Kategori"}
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
    backgroundColor: "#F5F4FF",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  catRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  catIconTxt: {
    fontSize: 18,
  },
  catInfo: {
    flex: 1,
    gap: 3,
  },
  catLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  catType: {
    fontSize: 12,
    color: "#888",
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  catBadgeTxt: {
    fontSize: 11,
    fontWeight: "500",
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F0EEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  editBtnTxt: {
    fontSize: 14,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnTxt: {
    fontSize: 14,
  },
  emptyCustom: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyText: {
    fontSize: 14,
    color: "#aaa",
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
  previewWrap: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
    marginBottom: 8,
  },
  previewIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  previewIconTxt: {
    fontSize: 32,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#555",
    marginBottom: 8,
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
  toggle: {
    flexDirection: "row",
    backgroundColor: "#F0EEFF",
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: "#6C5CE7",
  },
  toggleTxt: {
    fontSize: 11,
    color: "#888",
    fontWeight: "500",
  },
  toggleTxtActive: {
    color: "#fff",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#F9F9F9",
    alignItems: "center",
    justifyContent: "center",
  },
  iconOptionTxt: {
    fontSize: 20,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  colorOptionActive: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  colorCheck: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
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
