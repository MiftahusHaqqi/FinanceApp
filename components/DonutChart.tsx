import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { formatRupiah } from "../hooks/useTransactions";

interface DonutSlice {
  value: number;
  color: string;
  label: string;
  icon: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  total: number;
  size?: number;
  strokeWidth?: number;
}

export default function DonutChart({
  slices,
  total,
  size = 180,
  strokeWidth = 28,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Hitung offset tiap slice
  let cumulativePct = 0;
  const sliceData = slices.map((slice) => {
    const pct = total > 0 ? slice.value / total : 0;
    const dashArray = pct * circumference;
    const dashOffset = circumference - cumulativePct * circumference;
    cumulativePct += pct;
    return { ...slice, pct, dashArray, dashOffset };
  });

  return (
    <View style={styles.wrap}>
      {/* Donut SVG */}
      <View style={styles.chartWrap}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#F0EEFF"
            strokeWidth={strokeWidth}
          />
          <G rotation="-90" origin={`${cx}, ${cy}`}>
            {sliceData.map(
              (slice, i) =>
                slice.pct > 0 && (
                  <Circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${slice.dashArray} ${circumference}`}
                    strokeDashoffset={-slice.dashOffset + circumference}
                    strokeLinecap="butt"
                  />
                )
            )}
          </G>
        </Svg>

        {/* Teks tengah */}
        <View style={styles.centerLabel}>
          <Text style={styles.centerTitle}>Total</Text>
          <Text
            style={styles.centerAmount}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatRupiah(total)}
          </Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {sliceData.map((slice, i) => (
          <View key={i} style={styles.legendItem}>
            {/* Dot + ikon */}
            <View
              style={[styles.legendDot, { backgroundColor: slice.color }]}
            />
            <Text style={styles.legendIcon}>{slice.icon}</Text>
            <Text style={styles.legendLabel} numberOfLines={1}>
              {slice.label}
            </Text>
            <View style={styles.legendRight}>
              <Text style={styles.legendPct}>
                {(slice.pct * 100).toFixed(1)}%
              </Text>
              <Text style={styles.legendVal}>{formatRupiah(slice.value)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 16,
  },
  chartWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  centerTitle: {
    fontSize: 11,
    color: "#aaa",
  },
  centerAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A2E",
    marginTop: 2,
  },
  legend: {
    width: "100%",
    gap: 8,
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
    flexShrink: 0,
  },
  legendIcon: {
    fontSize: 14,
    flexShrink: 0,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    color: "#333",
  },
  legendRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  legendPct: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },
  legendVal: {
    fontSize: 11,
    color: "#aaa",
  },
});
