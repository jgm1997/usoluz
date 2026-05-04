const DEV_API_URL = "http://localhost:3000/api/v1";
const PROD_API_URL = "https://api.usoluz.com/api/v1";

export const Config = {
  apiUrl: __DEV__ ? DEV_API_URL : PROD_API_URL,
  defaultProvider: "ree_pvpc",
  refetchInterval: 1000 * 60 * 5, // 5 minutes
} as const;
