import { useQuery } from "@tanstack/react-query";
import { Config } from "../constants/config";
import { api } from "../services/api";

export function useTodayPrices(provider = Config.defaultProvider) {
  return useQuery({
    queryKey: ["todayPrices", provider],
    queryFn: () => api.getTodayPrices(provider),
    staleTime: 1000 * 60 * 30,
  });
}

export function usePricesByDate(
  date: string,
  provider = Config.defaultProvider,
) {
  return useQuery({
    queryKey: ["prices", date, provider],
    queryFn: () => api.getPricesByDate(date, provider),
    staleTime: 1000 * 60 * 60 * 24,
    enabled: !!date,
  });
}
