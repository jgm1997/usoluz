import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../constants/colors";
import { PriceClassification } from "../types/price";

const LABELS: Record<PriceClassification, string> = {
  cheap: "Barato",
  normal: "Normal",
  expensive: "Caro",
};

interface Props {
  classification: PriceClassification;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 3 },
  md: { fontSize: 13, paddingHorizontal: 12, paddingVertical: 5 },
  lg: { fontSize: 16, paddingHorizontal: 16, paddingVertical: 7 },
};

export function PriceBadge({ classification, size = "md" }: Readonly<Props>) {
  const color = Colors[classification];
  const sizeStyle = SIZES[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color.background,
          borderColor: color.border,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          paddingVertical: sizeStyle.paddingVertical,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: color.text,
            fontSize: sizeStyle.fontSize,
          },
        ]}
      >
        {LABELS[classification]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "600",
  },
});
