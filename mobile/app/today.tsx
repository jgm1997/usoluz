import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useTodayPrices } from "../hooks/usePrices";
import { PriceList } from "../components/PriceList";
import { PriceChart } from "../components/PriceChart";
import { Colors } from "../constants/colors";
import { useTranslation } from "react-i18next";
import { useNavigation } from "expo-router";
import { useEffect } from "react";

function StatCard({
  emoji,
  label,
  value,
  color,
}: Readonly<{
  emoji: string;
  label: string;
  value: string;
  color: string;
}>) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function formatPrice(value_kwh: number): string {
  return `${value_kwh} €`;
}

function formatHour(datetime_utc: string): string {
  return new Date(datetime_utc).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
}

function calcAverage(prices: { value_kwh: number }[]): string {
  const avg = prices.reduce((sum, p) => sum + p.value_kwh, 0) / prices.length;
  return `${avg.toFixed(5)} €`;
}

export default function TodayScreen() {
  const {
    data: todayPrices,
    isLoading,
    refetch,
    isRefetching,
  } = useTodayPrices();

  const navigation = useNavigation();
  const { t } = useTranslation();

  useEffect(() => {
    navigation.setOptions({ title: t("today.title") });
  }, [t]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t("today.loadingPrices")}</Text>
      </View>
    );
  }

  if (!todayPrices) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>⚡</Text>
        <Text style={styles.errorText}>{t("common.noData")}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Quick stats */}
      <View style={styles.statsRow}>
        <StatCard
          emoji="💚"
          label={t("today.cheapest")}
          value={`${formatHour(todayPrices.cheapest_hour.datetime_utc)}h · ${formatPrice(todayPrices.cheapest_hour.value_kwh)}`}
          color={Colors.cheap.text}
        />
        <StatCard
          emoji="📊"
          label={t("today.average")}
          value={calcAverage(todayPrices.prices)}
          color={Colors.normal.text}
        />
        <StatCard
          emoji="🔴"
          label={t("today.mostExpensive")}
          value={`${formatHour(todayPrices.most_expensive_hour.datetime_utc)}h · ${formatPrice(todayPrices.most_expensive_hour.value_kwh)}`}
          color={Colors.expensive.text}
        />
      </View>

      {/* Chart */}
      <PriceChart prices={todayPrices.prices} />

      {/* Hourly prices list */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("today.pricesByHour")}</Text>
        <View style={styles.listCard}>
          <PriceList prices={todayPrices.prices} highlightCurrent />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorEmoji: {
    fontSize: 48,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statEmoji: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  statValue: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    paddingHorizontal: 2,
  },
  listCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
});
