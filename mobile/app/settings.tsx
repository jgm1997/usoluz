import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  View,
  TextInput,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { PriceBadge } from "../components/PriceBadge";
import { Colors } from "../constants/colors";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAlertStore } from "../store/alertStore";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../store/settingsStore";
import { useNavigation } from "expo-router";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: false,
  }),
});

async function registerForPushNotifications(
  t: (key: string) => string,
): Promise<string | null> {
  if (!Device.isDevice) {
    Alert.alert(t("settings.errorNotifications"));
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert(
      t("settings.permissionDenied"),
      t("settings.permissionDeniedMsg"),
    );
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

function getButtonText(
  isSaving: boolean,
  savedOk: boolean,
  t: (key: string) => string,
) {
  if (isSaving) return t("settings.saving");
  if (savedOk) return t("settings.saved");
  return t("settings.save");
}
interface AlertRowProps {
  label: string;
  description: string;
  type: "below" | "above";
  classification: "cheap" | "expensive";
  threshold: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  onChangeThreshold: (value: string) => void;
}

function AlertRow({
  label,
  description,
  type,
  classification,
  threshold,
  enabled,
  onToggle,
  onChangeThreshold,
}: Readonly<AlertRowProps>) {
  return (
    <View style={styles.alertRow}>
      <View style={styles.alertRowHeader}>
        <View style={styles.alertRowInfo}>
          <View style={styles.alertRowTitle}>
            <PriceBadge classification={classification} size="sm" />
            <Text style={styles.alertLabel}>{label}</Text>
          </View>
          <Text style={styles.alertDescription}>{description}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{
            false: Colors.border,
            true: Colors[classification].border,
          }}
          thumbColor={enabled ? Colors[classification].text : "#f4f3f4"}
        />
      </View>

      {enabled && (
        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Threshold (c€/kWh)</Text>
          <View style={styles.thresholdInputWrapper}>
            <TextInput
              style={styles.thresholdInput}
              value={threshold}
              onChangeText={onChangeThreshold}
              keyboardType="decimal-pad"
              placeholder="e.g.: 10.00"
              placeholderTextColor={Colors.textSecondary}
              maxLength={6}
            />
            <Text style={styles.thresholdUnit}>c€</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const {
    deviceToken,
    cheapAlertEnabled,
    cheapThreshold,
    expensiveAlertEnabled,
    expensiveThreshold,
    setDeviceToken,
    setCheapAlert,
    setCheapThreshold,
    setExpensiveAlert,
    setExpensiveThreshold,
  } = useAlertStore();

  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const { t } = useTranslation();
  const { language, setLanguage } = useSettingsStore();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ headerTitle: t("settings.title") });
    async function setup() {
      if (deviceToken) return;
      const token = await registerForPushNotifications(t);
      if (token) {
        setDeviceToken(token);
        await api.registerDevice(token, Platform.OS as "ios" | "android");
      }
    }
    setup();
  }, [t]);

  async function handleSave() {
    if (!deviceToken) {
      Alert.alert(
        t("settings.noPermission"),
        t("settings.noPermissionDescription"),
      );
      return;
    }

    const cheapVal = Number.parseFloat(cheapThreshold);
    const expensiveVal = Number.parseFloat(expensiveThreshold);

    if (cheapAlertEnabled && (Number.isNaN(cheapVal) || cheapVal <= 0)) {
      Alert.alert(
        t("settings.invalidThreshold"),
        t("settings.invalidThresholdDescription"),
      );
      return;
    }

    if (
      expensiveAlertEnabled &&
      (Number.isNaN(expensiveVal) || expensiveVal <= 0)
    ) {
      Alert.alert(
        t("settings.invalidExpensiveThreshold"),
        t("settings.invalidExpensiveThresholdDescription"),
      );
      return;
    }

    setIsSaving(true);
    try {
      if (cheapAlertEnabled) {
        await api.createAlert({
          device_token: deviceToken,
          platform: Platform.OS as "ios" | "android",
          alert_type: "below",
          threshold_kwh: cheapVal / 100,
        });
      }

      if (expensiveAlertEnabled) {
        await api.createAlert({
          device_token: deviceToken,
          platform: Platform.OS as "ios" | "android",
          alert_type: "above",
          threshold_kwh: expensiveVal / 100,
        });
      }

      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch {
      Alert.alert(t("settings.saveError"), t("settings.saveErrorMsg"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Device state */}
      <View style={styles.deviceCard}>
        <View style={styles.deviceStatus}>
          <View
            style={[
              styles.deviceDot,
              {
                backgroundColor: deviceToken
                  ? Colors.cheap.text
                  : Colors.expensive.text,
              },
            ]}
          >
            <Text style={styles.deviceText}>
              {deviceToken
                ? t("settings.deviceRegistered")
                : t("settings.deviceNotRegistered")}
            </Text>
          </View>
          {!deviceToken && (
            <Pressable
              style={styles.registerButton}
              onPress={async () => {
                const token = await registerForPushNotifications(t);
                if (token) {
                  setDeviceToken(token);
                  await api.registerDevice(
                    token,
                    Platform.OS as "ios" | "android",
                  );
                }
              }}
            >
              <Text style={styles.registerButtonText}>
                {t("settings.activateNotifications")}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("settings.configureAlerts")}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {t("settings.configureAlertsSubtitle")}
          </Text>

          <View style={styles.alertsCard}>
            <AlertRow
              label={t("settings.lowPrice")}
              description={t("settings.lowPriceDesc")}
              type="below"
              classification="cheap"
              threshold={cheapThreshold}
              enabled={cheapAlertEnabled}
              onToggle={setCheapAlert}
              onChangeThreshold={setCheapThreshold}
            />

            <View style={styles.divider} />

            <AlertRow
              label={t("settings.highPrice")}
              description={t("settings.highPriceDesc")}
              type="above"
              classification="expensive"
              threshold={expensiveThreshold}
              enabled={expensiveAlertEnabled}
              onToggle={setExpensiveAlert}
              onChangeThreshold={setExpensiveThreshold}
            />
          </View>
        </View>

        {/* Price reference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("settings.priceReference")}
          </Text>
          <View style={styles.referenceCard}>
            <View style={styles.referenceRow}>
              <PriceBadge classification="cheap" size="md" />
              <Text style={styles.referenceText}>
                {t("settings.cheapBelow")}
              </Text>
            </View>
            <View style={styles.referenceRow}>
              <PriceBadge classification="normal" size="md" />
              <Text style={styles.referenceText}>
                {t("settings.normalBetween")}
              </Text>
            </View>

            <View style={styles.referenceRow}>
              <PriceBadge classification="expensive" size="md" />
              <Text style={styles.referenceText}>
                {t("settings.expensiveAbove")}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
        <View style={styles.languageCard}>
          {(["en", "es", "ca"] as const).map((lang) => (
            <Pressable
              key={lang}
              onPress={() => setLanguage(lang)}
              style={[
                styles.languageOption,
                language === lang && styles.languageOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.languageText,
                  language === lang && styles.languageTextActive,
                ]}
              >
                {t(`languages.${lang}`)}
              </Text>
              {language === lang && <Text style={styles.languageCheck}>✓</Text>}
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={[
          styles.saveButton,
          isSaving && styles.saveButtonDisabled,
          savedOk && styles.saveButtonSuccess,
        ]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>
          {getButtonText(isSaving, savedOk, t)}
        </Text>
      </Pressable>
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
    paddingBottom: 48,
  },
  deviceCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  deviceStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deviceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  deviceText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  registerButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    paddingHorizontal: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingHorizontal: 2,
  },
  alertsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  alertRow: {
    padding: 16,
    gap: 12,
  },
  alertRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  alertRowInfo: { flex: 1, gap: 4 },
  alertRowTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alertLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  alertDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  thresholdRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
  },
  thresholdLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  thresholdInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  thresholdInput: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    minWidth: 64,
    textAlign: "right",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 2,
  },
  thresholdUnit: { fontSize: 13, color: Colors.textSecondary },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  referenceCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  referenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  referenceText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonSuccess: {
    backgroundColor: Colors.cheap.text,
  },
  saveButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  languageCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  languageOptionActive: {
    backgroundColor: Colors.cheap.background,
  },
  languageText: {
    fontSize: 14,
    color: Colors.text,
  },
  languageTextActive: {
    fontWeight: "600",
    color: Colors.cheap.text,
  },
  languageCheck: {
    fontSize: 16,
    color: Colors.cheap.text,
    fontWeight: "700",
  },
});
