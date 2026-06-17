import { Tabs } from "expo-router";
import { Home, DoorOpen, ShieldAlert, User } from "lucide-react-native";
import { Platform } from "react-native";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", letterSpacing: 0.2 },
        tabBarIconStyle: { marginBottom: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => <Home color={color} size={24} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="visitas"
        options={{
          title: "Visitas",
          tabBarIcon: ({ color }) => <DoorOpen color={color} size={24} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="panico"
        options={{
          title: "Pánico",
          tabBarIcon: ({ color }) => <ShieldAlert color={color} size={24} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <User color={color} size={24} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
