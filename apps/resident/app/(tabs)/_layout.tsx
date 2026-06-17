import { Tabs } from "expo-router";
import { Home, DoorOpen, ShieldAlert, User } from "lucide-react-native";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="visitas" options={{ title: "Visitas", tabBarIcon: ({ color, size }) => <DoorOpen color={color} size={size} /> }} />
      <Tabs.Screen name="panico" options={{ title: "Pánico", tabBarIcon: ({ color, size }) => <ShieldAlert color={color} size={size} /> }} />
      <Tabs.Screen name="perfil" options={{ title: "Perfil", tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tabs>
  );
}
