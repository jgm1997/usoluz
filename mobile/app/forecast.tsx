import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
} from "react-native";
import { usePricesByDate } from "../hooks/usePrices";
import { Colors } from "../constants/colors";
import { PriceChart } from "../components/PriceChart";
import { PriceList } from "../components/PriceList";
import { useTranslation } from "react-i18next";
import { useNavigation } from "expo-router";
import { useEffect } from "react";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatPrice(value_kwh: number): string {
  return `${value_kwh.toFixed(5)} €/kWh`;
}

function formatHour(datetime_utc: string): string {
  return new Date(datetime_utc).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
}

function getTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

function calcAverage(prices: { value_kwh: number }[]): number {
  return prices.reduce((sum, p) => sum + p.value_kwh, 0) / prices.length;
}

function NotAvailable() {
  const { t } = useTranslation();
  return (
    <View style={styles.notAvailable}>
      <Text style={styles.notAvailableEmoji}>🕐</Text>
      <Text style={styles.notAvailableTitle}>
        {t("forecast.notAvailableTitle")}
      </Text>
      <Text style={styles.notAvailableText}>
        {t("forecast.notAvailableText")}
      </Text>
    </View>
  );
}

export default function ForecastScreen() {
  const tomorrow = getTomorrow();

  const {
    data: forecastPrices,
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = usePricesByDate(tomorrow);

  const { t } = useTranslation();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: t("forecast.title") });
  }, [t]);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Text style={styles.loadingText}>{t("forecast.loadingPrices")}</Text>
      </View>
    );
  }

  if (isError || !forecastPrices || forecastPrices.prices.length === 0) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.centeredContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
      >
        <NotAvailable />
      </ScrollView>
    );
  }

  const avg = calcAverage(forecastPrices.prices);
  const cheapCount = forecastPrices.prices.filter(
    (p) => p.classification === "cheap",
  ).length;
  const expensiveCount = forecastPrices.prices.filter(
    (p) => p.classification === "expensive",
  ).length;

  const getAdviceMessage = (): string => {
    if (cheapCount > 6) {
      return t("forecast.tipCheap", { count: cheapCount });
    }
    if (expensiveCount > 8) {
      return t("forecast.tipExpensive", { count: expensiveCount });
    }
    return t("forecast.tipNormal");
  };

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
      {/* Header with date */}
      <View style={styles.dateCard}>
        <Text style={styles.dateLabel}>{t("forecast.pricesFor")}</Text>
        <Text style={styles.dateValue}>{formatDate(forecastPrices.date)}</Text>
      </View>

      {/* Day summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>{t("forecast.summary")}</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>💚</Text>
            <Text style={styles.summaryLabel}>
              {t("forecast.cheapestHour")}
            </Text>
            <Text style={[styles.summaryValue, { color: Colors.cheap.text }]}>
              {formatHour(forecastPrices.cheapest_hour.datetime_utc)}h
            </Text>
            <Text style={styles.summarySubvalue}>
              {formatPrice(forecastPrices.cheapest_hour.value_kwh)}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>📊</Text>
            <Text style={styles.summaryLabel}>
              {t("forecast.averagePrice")}
            </Text>
            <Text style={styles.summarySubvalue}>{formatPrice(avg)}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>🔴</Text>
            <Text style={styles.summaryLabel}>
              {t("forecast.mostExpensiveHour")}
            </Text>
            <Text
              style={[styles.summaryValue, { color: Colors.expensive.text }]}
            >
              {formatHour(forecastPrices.most_expensive_hour.datetime_utc)}h
            </Text>
            <Text style={styles.summarySubvalue}>
              {formatPrice(forecastPrices.most_expensive_hour.value_kwh)}
            </Text>
          </View>
        </View>
      </View>

      {/* Daily advice */}
      <View style={styles.tipCard}>
        <Text style={styles.tipEmoji}>💡</Text>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>{t("forecast.tip")}</Text>
          <Text style={styles.tipText}>{getAdviceMessage()}</Text>
        </View>
      </View>

      {/* Price chart */}
      <PriceChart prices={forecastPrices.prices} />

      {/* 24 hour list */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("forecast.pricesByHour")}</Text>
        <View style={styles.listCard}>
          <PriceList prices={forecastPrices.prices} highlightCurrent={false} />
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
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 32,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  dateCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  dateLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  dateValue: {
    fontSize: 20,
    color: "#ffffff",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  summaryEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  summarySubvalue: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  summaryDivider: {
    width: 1,
    height: "100%",
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  tipCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tipEmoji: { fontSize: 28 },
  tipContent: { flex: 1, gap: 4 },
  tipTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  section: { gap: 10 },
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
  notAvailable: {
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  notAvailableEmoji: {
    fontSize: 56,
  },
  notAvailableTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  notAvailableText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
