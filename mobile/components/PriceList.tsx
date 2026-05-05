import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/colors";
import { PriceItem } from "../types/price";

interface Props {
  prices: PriceItem[];
  highlightCurrent?: boolean;
}

function formatHour(datetime_utc: string): string {
  const date = new Date(datetime_utc);
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
}

function getCurrentHour(): number {
  return new Date().getHours();
}

function getItemHour(datetime_utc: string): number {
  return new Date(datetime_utc).toLocaleString("es-ES", {
    hour: "numeric",
    timeZone: "Europe/Madrid",
    hour12: false,
  }) as unknown as number;
}

function PriceRow({
  item,
  isCurrent,
}: Readonly<{
  item: PriceItem;
  isCurrent: boolean;
}>) {
  const color = Colors[item.classification];

  return (
    <View
      style={[
        styles.row,
        isCurrent && styles.currentRow,
        isCurrent && { borderLeftColor: color.text },
      ]}
    >
      {/* Hour */}
      <Text style={[styles.hour, isCurrent && { fontWeight: "700" }]}>
        {formatHour(item.datetime_utc)}
      </Text>

      {/* Visual proportional bar to price */}
      <View style={styles.barContainer}>
        <View
          style={[
            styles.bar,
            {
              width: `${Math.min((item.value_kwh / 0.35) * 100, 100)}%`,
              backgroundColor: color.border,
            },
          ]}
        />
      </View>

      {/* Price */}
      <Text numberOfLines={1} style={[styles.price, { color: color.text }]}>
        {item.value_kwh.toFixed(5)}
        <Text style={styles.priceUnit}> €</Text>
      </Text>
    </View>
  );
}

export function PriceList({
  prices,
  highlightCurrent = true,
}: Readonly<Props>) {
  const hour = getCurrentHour();

  return (
    <View style={styles.list}>
      {prices.map((item) => (
        <PriceRow
          key={item.datetime_utc}
          item={item}
          isCurrent={
            highlightCurrent && Number(getItemHour(item.datetime_utc)) === hour
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },
  currentRow: {
    borderLeftWidth: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  hour: {
    width: 48,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 3,
  },
  price: {
    width: 82,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: "400",
    color: Colors.textSecondary,
  },
});
