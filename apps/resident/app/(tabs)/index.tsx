import * as React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import {
  Bell, Users, Megaphone, Briefcase, DoorOpen, CalendarDays, MessageCircleQuestion, Building2,
} from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { colors, radius, spacing } from "@/lib/theme";

interface Card { key: string; label: string; Icon: typeof Bell; href: Href }

const CARDS: Card[] = [
  { key: "notificaciones", label: "Notificaciones", Icon: Bell, href: "/notificaciones" },
  { key: "visitantes", label: "Visitantes", Icon: Users, href: "/visitantes" },
  { key: "avisos", label: "Avisos", Icon: Megaphone, href: "/avisos" },
  { key: "staff", label: "Staff", Icon: Briefcase, href: "/staff" },
  { key: "visitas", label: "Visitas", Icon: DoorOpen, href: "/(tabs)/visitas" },
  { key: "reservaciones", label: "Reservaciones", Icon: Building2, href: "/reservaciones" },
  { key: "sugerencias", label: "Sugerencias", Icon: MessageCircleQuestion, href: "/sugerencias" },
  { key: "eventos", label: "Eventos", Icon: CalendarDays, href: "/(tabs)" }, // stub: pendiente §6
];

export default function HomeScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Responsive: en tablet (≥768) usamos 3 columnas y márgenes amplios; en teléfono, 2.
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const colWidth = isTablet ? "31%" : "47%";

  function open(card: Card) {
    if (card.key === "eventos") {
      Alert.alert("Eventos", "Disponible próximamente.");
      return;
    }
    router.push(card.href);
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, paddingHorizontal: isTablet ? spacing.xl * 2 : spacing.xl }]}>
        <Text style={styles.hi}>Hola,</Text>
        <Text style={styles.name}>{profile?.name ?? "Residente"}</Text>
        <Text style={styles.house}>{profile?.houseAddress ?? "Sin domicilio"} · {profile?.residentialName ?? ""}</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.grid, isTablet && { paddingHorizontal: spacing.xl }]}>
        {CARDS.map((c) => (
          <Pressable key={c.key} style={[styles.card, { width: colWidth }]} onPress={() => open(c)}>
            <View style={styles.iconWrap}><c.Icon color={colors.brand} size={24} /></View>
            <Text style={styles.cardLabel}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.ink, paddingBottom: spacing.xl },
  hi: { color: colors.textFaint, fontSize: 14 },
  name: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 2 },
  house: { color: colors.textFaint, fontSize: 13, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.brandSoft,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.md,
  },
  cardLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
});
