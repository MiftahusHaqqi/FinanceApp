import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTransactions, formatMonthLabel } from "../../hooks/useTransactions";
import { getAllTransactions, getTransactionsByMonth } from "../../database/db";
import { exportToExcel, exportAllToExcel } from "../../utils/exportExcel";

export default function SettingsScreen() {
  const { activeYear, activeMonth } = useTransactions();
  const [isExporting, setIsExporting] = useState(false);

  // ── Export bulan ini ────────────────────────────────────────────────────────
  const handleExportMonth = async () => {
    setIsExporting(true);
    try {
      const txs = getTransactionsByMonth(activeYear, activeMonth);
      if (txs.length === 0) {
        Alert.alert(
          "Tidak ada data",
          `Tidak ada transaksi di ${formatMonthLabel(activeYear, activeMonth)}.`
        );
        return;
      }
      await exportToExcel(txs, activeYear, activeMonth);
      Alert.alert("Berhasil", "File Excel siap dibagikan.");
    } catch (e) {
      console.error("Export bulan ini gagal:", e);
      Alert.alert("Gagal", "Terjadi kesalahan saat export Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Export semua ────────────────────────────────────────────────────────────
  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const txs = getAllTransactions();
      if (txs.length === 0) {
        Alert.alert("Tidak ada data", "Belum ada transaksi yang tersimpan.");
        return;
      }
      await exportAllToExcel(txs);
      Alert.alert("Berhasil", "File Excel siap dibagikan.");
    } catch (e) {
      console.error("Export semua data gagal:", e);
      Alert.alert("Gagal", "Terjadi kesalahan saat export Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Setelan</Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* ── Export data ── */}
        <Text style={styles.sectionLabel}>Export Data</Text>
        <View style={styles.card}>
          {/* Export bulan ini */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleExportMonth}
            disabled={isExporting}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#E8F5E9" }]}>
              <Text style={styles.menuIconTxt}>📅</Text>
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Export Bulan Ini</Text>
              <Text style={styles.menuSubtitle}>
                {formatMonthLabel(activeYear, activeMonth)} → file .xlsx
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Export semua */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleExportAll}
            disabled={isExporting}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#E3F2FD" }]}>
              <Text style={styles.menuIconTxt}>📦</Text>
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Export Semua Data</Text>
              <Text style={styles.menuSubtitle}>
                Semua transaksi → file .xlsx
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Info app ── */}
        <Text style={styles.sectionLabel}>Informasi</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versi App</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Penyimpanan</Text>
            <Text style={styles.infoValue}>Lokal (SQLite)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bulan Aktif</Text>
            <Text style={styles.infoValue}>
              {formatMonthLabel(activeYear, activeMonth)}
            </Text>
          </View>
        </View>

        {/* ── Loading indicator ── */}
        {isExporting && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#6C5CE7" />
            <Text style={styles.loadingTxt}>Sedang mengekspor...</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  },
  body: {
    flex: 1,
    backgroundColor: "#F5F4FF",
    paddingHorizontal: 16,
    paddingTop: 20,
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
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconTxt: {
    fontSize: 18,
  },
  menuInfo: {
    flex: 1,
    gap: 3,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#888",
  },
  menuArrow: {
    fontSize: 20,
    color: "#ccc",
  },
  divider: {
    height: 1,
    backgroundColor: "#F5F5F5",
    marginLeft: 68,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  infoLabel: {
    fontSize: 14,
    color: "#555",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  loadingTxt: {
    fontSize: 13,
    color: "#6C5CE7",
  },
});
