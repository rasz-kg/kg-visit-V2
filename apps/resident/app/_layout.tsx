import * as React from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

// Rutas públicas (accesibles sin sesión). Cualquier otra ruta requiere sesión.
const PUBLIC_ROUTES = new Set(["login", "recuperar"]);

// Redirige entre login y la app según haya sesión.
function Gate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return;
    const root = segments[0] ?? "";
    const inPublicRoute = PUBLIC_ROUTES.has(root);
    // Sin sesión: solo se permite estar en rutas públicas; cualquier otra → login.
    if (!session && !inPublicRoute) {
      router.replace("/login");
      return;
    }
    // Con sesión: si estás en una ruta pública (login/recuperar), te mando al dashboard.
    if (session && inPublicRoute) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
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
        <Gate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
