import { useNavigation, useRouter } from "expo-router";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useCurrentPrice } from "../hooks/useCurrentPrice";
import { useTodayPrices } from "../hooks/usePrices";
import { Colors } from "../constants/colors";
import { PriceCard } from "../components/PriceCard";
import { PriceChart } from "../components/PriceChart";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

function SummaryRow({
  label,
  value,
  color,
}: Readonly<{
  label: string;
  value: string;
  color: string;
}>) {
  return (
    <View style={styles.summaryIndex}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

function formatPrice(value_kwh: number): string {
  return `${value_kwh} €/kWh`;
}

function formatHour(datetime_utc: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(new Date(datetime_utc));
}

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { t } = useTranslation();

  useEffect(() => {
    navigation.setOptions({ title: t("home.title") });
  }, [t]);

  const {
    data: currentPrice,
    isLoading: loadingCurrent,
    refetch: refetchCurrent,
    isRefetching: refetchingCurrent,
  } = useCurrentPrice();

  const {
    data: todayPrices,
    isLoading: loadingToday,
    refetch: refetchToday,
  } = useTodayPrices();

  const isRefreshing = refetchingCurrent;

  async function handleRefresh() {
    await Promise.all([refetchCurrent(), refetchToday()]);
  }

  if (loadingCurrent || loadingToday) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (!currentPrice) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>⚡</Text>
        <Text style={styles.errorText}>{t("common.error")}</Text>
        <Pressable style={styles.retryButton} onPress={() => refetchCurrent()}>
          <Text style={styles.retryText}>{t("common.retry")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      <PriceCard price={currentPrice} />

      {todayPrices && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("home.todaySummary")}</Text>
          <View style={styles.summaryCard}>
            <SummaryRow
              label={`💚 ${t("home.cheapestHour")}`}
              value={`${formatHour(todayPrices.cheapest_hour.datetime_utc)} · ${formatPrice(todayPrices.cheapest_hour.value_kwh)}`}
              color={Colors.cheap.text}
            />
            <View style={styles.divider} />
            <SummaryRow
              label={`🔴 ${t("home.mostExpensiveHour")}`}
              value={`${formatHour(todayPrices.most_expensive_hour.datetime_utc)} · ${formatPrice(todayPrices.most_expensive_hour.value_kwh)}`}
              color={Colors.expensive.text}
            />
          </View>
        </View>
      )}

      {todayPrices && (
        <View style={styles.section}>
          <PriceChart prices={todayPrices.prices} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("home.seeMore")}</Text>
        <View style={styles.quickActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push("/today")}
          >
            <Text style={styles.actionEmoji}>📋</Text>
            <Text style={styles.actionText}>{t("home.todayList")}</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push("/forecast")}
          >
            <Text style={styles.actionEmoji}>📈</Text>
            <Text style={styles.actionText}>{t("home.tomorrow")}</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push("/settings")}
          >
            <Text style={styles.actionEmoji}>🔔</Text>
            <Text style={styles.actionText}>{t("home.alerts")}</Text>
          </Pressable>
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
  // ← CORREGIDO: era flex:1, ahora tiene padding y gap
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
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  retryText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
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
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  // ← CORREGIDO: era círculo azul, ahora es contenedor de columna
  summaryIndex: {
    flexDirection: "column",
    gap: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.text,
    textAlign: "center",
  },
});
