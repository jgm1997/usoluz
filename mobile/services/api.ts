import axios from "axios";
import { Config } from "../constants/config";
import { CurrentPrice, DayPrices } from "../types/price";

const client = axios.create({
  baseURL: Config.apiUrl,
  timeout: 10000,
});

export const api = {
  getCurrentPrice: async (
    provider = Config.defaultProvider,
  ): Promise<CurrentPrice> => {
    const { data } = await client.get(`/prices/current`, {
      params: { provider },
    });
    return data;
  },

  getTodayPrices: async (
    provider = Config.defaultProvider,
  ): Promise<DayPrices> => {
    const { data } = await client.get(`/prices/today`, {
      params: { provider },
    });
    return data;
  },

  getPricesByDate: async (
    date: string,
    provider = Config.defaultProvider,
  ): Promise<DayPrices> => {
    const { data } = await client.get(`/prices/${date}`, {
      params: { provider },
    });
    return data;
  },

  registerDevice: async (token: string, platform: "ios" | "android") => {
    const { data } = await client.post("/alerts/devices", {
      token,
      platform,
      timezone: "Europe/Madrid",
    });
    return data;
  },

  createAlert: async (payload: {
    device_token: string;
    platform: "ios" | "android";
    alert_type: "below" | "above";
    threshold_kwh: number;
    provider?: string;
  }) => {
    const { data } = await client.post("/alerts", payload);
    return data;
  },

  deleteAlert: async (alertId: number) => {
    await client.delete(`/alerts/${alertId}`);
  }
};
