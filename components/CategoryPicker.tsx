import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { getCategoriesByType } from "../constants/categories";
import { TransactionType } from "../database/db";

interface CategoryPickerProps {
  type: TransactionType;
  selected: string;
  onSelect: (categoryId: string) => void;
}

export default function CategoryPicker({
  type,
  selected,
  onSelect,
}: CategoryPickerProps) {
  const categories = getCategoriesByType(type);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => {
        const isActive = selected === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.item,
              isActive && { borderColor: cat.color, backgroundColor: cat.bg },
            ]}
            onPress={() => onSelect(cat.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{cat.icon}</Text>
            <Text
              style={[
                styles.label,
                isActive && { color: cat.color, fontWeight: "600" },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#F9F9F9",
    gap: 4,
    minWidth: 64,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 10,
    color: "#666",
  },
});
