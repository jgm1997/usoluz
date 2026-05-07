const DEV_API_URL = "http://localhost:8000/api/v1";
const PROD_API_URL = "https://usoluz-backend.onrender.com/api/v1";

export const Config = {
  apiUrl: process.env.EXPO_PUBLIC_APP_ENV === "production" ? PROD_API_URL : DEV_API_URL,
  defaultProvider: "ree_pvpc",
  refetchInterval: 1000 * 60 * 5, // 5 minutes
} as const;
