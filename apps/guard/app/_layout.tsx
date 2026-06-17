import * as React from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/lib/auth";
import { BoothProvider } from "@/lib/booth";
import { colors } from "@/lib/theme";

// Redirige entre login y la app según haya sesión.
function Gate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "(app)";
    if (!session && inAuthGroup) router.replace("/login");
    else if (session && !inAuthGroup) router.replace("/(app)");
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink }}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <BoothProvider>
          <Gate />
        </BoothProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
