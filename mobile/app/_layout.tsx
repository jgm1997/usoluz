import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#ffffff" },
          headerTintColor: "#212121",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#f5f5f5" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Light price" }} />
        <Stack.Screen name="today" options={{ title: "Today" }} />
        <Stack.Screen name="forecast" options={{ title: "Forecast" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack>
    </QueryClientProvider>
  );
}
