import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../constants/colors";
import { PriceBadge } from "./PriceBadge";
import { CurrentPrice } from "../types/price";

interface Props {
  price: CurrentPrice;
}

function formatHour(datetime_utc: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(new Date(datetime_utc));
}

export function PriceCard({ price }: Readonly<Props>) {
  const color = Colors[price.classification];

  return (
    <View style={[styles.card, { borderColor: color.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.label}>Current price</Text>
        <Text style={styles.hour}>Slot {formatHour(price.datetime_utc)}h</Text>
      </View>

      {/* Main price */}
      <View
        style={[styles.priceContainer, { backgroundColor: color.background }]}
      >
        <Text style={[styles.priceValue, { color: color.text }]}>
          {(price.value_kwh * 100).toFixed(2)}
        </Text>
        <Text style={[styles.priceUnit, { color: color.text }]}>c€/kWh</Text>
      </View>

      {/* Badge + price in MWh */}
      <View style={styles.footer}>
        <PriceBadge classification={price.classification} size="lg" />
        <Text style={styles.mwhPrice}>{price.value_kwh.toFixed(5)} €/kWh</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  hour: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 24,
    marginBottom: 16,
    gap: 6,
  },
  priceValue: {
    fontSize: 60,
    fontWeight: "800",
    lineHeight: 68,
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mwhPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
