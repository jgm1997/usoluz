import { Dimensions, StyleSheet, Text, View } from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import { Colors } from "../constants/colors";
import { PriceClassification, PriceItem } from "../types/price";
import { useTranslation } from "react-i18next";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_W = SCREEN_WIDTH - 32;
const CHART_H = 200;
const PAD = { top: 10, bottom: 40, left: 44, right: 16 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;
const Y_TICKS = 4;

interface Props {
  prices: PriceItem[];
}

function barColor(classification: PriceClassification): string {
  return Colors[classification].text;
}

export function PriceChart({ prices }: Readonly<Props>) {
  const { t } = useTranslation();
  const data = prices.map((p) => ({
    value: p.value_kwh,
    classification: p.classification,
    hour: new Date(p.datetime_utc).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      timeZone: "Europe/Madrid",
    }),
  }));

  const maxVal = Math.max(...data.map((d) => d.value), 0.001);
  const n = data.length;
  const slotW = n > 0 ? PLOT_W / n : 0;
  const barW = slotW * 0.75;

  const yTicks = Array.from(
    { length: Y_TICKS + 1 },
    (_, i) => Math.round(((maxVal / Y_TICKS) * i + Number.EPSILON) * 100) / 100,
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("home.dailyEvolution")}</Text>
      <Text style={styles.subtitle}>{t("home.chartSubtitle")}</Text>
      <Svg width={CHART_W} height={CHART_H}>
        <G transform={`translate(${PAD.left}, ${PAD.top})`}>
          {yTicks.map((tick) => {
            const y = PLOT_H - (tick / maxVal) * PLOT_H;
            return (
              <G key={tick}>
                <Line
                  x1={0}
                  y1={y}
                  x2={PLOT_W}
                  y2={y}
                  stroke={Colors.border}
                  strokeDasharray="4,4"
                  strokeWidth={1}
                />
                <SvgText
                  x={-4}
                  y={y + 4}
                  fontSize={10}
                  fill={Colors.textSecondary}
                  textAnchor="end"
                >
                  {tick.toFixed(5)}
                </SvgText>
              </G>
            );
          })}

          <Line
            x1={0}
            y1={PLOT_H}
            x2={PLOT_W}
            y2={PLOT_H}
            stroke={Colors.border}
            strokeWidth={1}
          />

          {data.map((d, i) => {
            const x = i * slotW + (slotW - barW) / 2;
            const barH = (d.value / maxVal) * PLOT_H;
            return (
              <G key={d.hour}>
                <Rect
                  x={x}
                  y={PLOT_H - barH}
                  width={barW}
                  height={barH}
                  fill={barColor(d.classification)}
                  opacity={0.85}
                  rx={3}
                />
                {i % 4 === 0 && (
                  <SvgText
                    x={x + barW / 2}
                    y={PLOT_H + 16}
                    fontSize={10}
                    fill={Colors.textSecondary}
                    textAnchor="middle"
                  >
                    {d.hour}
                  </SvgText>
                )}
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
});
