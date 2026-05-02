export type CategoryId = string;

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  type: "expense" | "income" | "both";
  custom?: boolean;
}

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "food",
    label: "Makanan",
    icon: "🛒",
    color: "#2E7D32",
    bg: "#E8F5E9",
    type: "expense",
  },
  {
    id: "transport",
    label: "Transportasi",
    icon: "🚗",
    color: "#E65100",
    bg: "#FFF3E0",
    type: "expense",
  },
  {
    id: "health",
    label: "Kesehatan",
    icon: "🏥",
    color: "#C62828",
    bg: "#FFEBEE",
    type: "expense",
  },
  {
    id: "entertainment",
    label: "Hiburan",
    icon: "🎮",
    color: "#6A1B9A",
    bg: "#F3E5F5",
    type: "expense",
  },
  {
    id: "shopping",
    label: "Belanja",
    icon: "👗",
    color: "#AD1457",
    bg: "#FCE4EC",
    type: "expense",
  },
  {
    id: "home",
    label: "Rumah",
    icon: "🏠",
    color: "#4527A0",
    bg: "#EDE7F6",
    type: "expense",
  },
  {
    id: "education",
    label: "Edukasi",
    icon: "📚",
    color: "#1565C0",
    bg: "#E3F2FD",
    type: "expense",
  },
  {
    id: "salary",
    label: "Gaji",
    icon: "💼",
    color: "#1B5E20",
    bg: "#E8F5E9",
    type: "income",
  },
  {
    id: "bonus",
    label: "Bonus",
    icon: "🎁",
    color: "#F57F17",
    bg: "#FFFDE7",
    type: "income",
  },
  {
    id: "investment",
    label: "Investasi",
    icon: "📈",
    color: "#00695C",
    bg: "#E0F2F1",
    type: "income",
  },
  {
    id: "other",
    label: "Lainnya",
    icon: "📌",
    color: "#546E7A",
    bg: "#ECEFF1",
    type: "both",
  },
];

// ─── Tidak ada DB call di sini — hanya data statis ───────────────────────────

export function getAllCategories(): Category[] {
  return [...DEFAULT_CATEGORIES];
}

export function getCategoryById(id: string): Category {
  return (
    DEFAULT_CATEGORIES.find((c) => c.id === id) ?? {
      id: "other",
      label: "Lainnya",
      icon: "📌",
      color: "#546E7A",
      bg: "#ECEFF1",
      type: "both",
    }
  );
}

export function getCategoriesByType(type: "income" | "expense"): Category[] {
  return DEFAULT_CATEGORIES.filter((c) => c.type === type || c.type === "both");
}

// Backward compatibility
export const CATEGORIES = DEFAULT_CATEGORIES;

export const CHART_COLORS = [
  "#6C5CE7",
  "#00B894",
  "#FDCB6E",
  "#E17055",
  "#0984E3",
  "#A29BFE",
  "#55EFC4",
  "#FD79A8",
];
