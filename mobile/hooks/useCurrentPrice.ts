import { Config } from "../constants/config";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function useCurrentPrice(provider = Config.defaultProvider) {
    return useQuery({
        queryKey: ["currentPrice", provider],
        queryFn: () => api.getCurrentPrice(provider),
        refetchInterval: Config.refetchInterval,
        staleTime: 1000 * 60 * 4
    })
}