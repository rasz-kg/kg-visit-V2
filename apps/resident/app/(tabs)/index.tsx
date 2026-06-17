import * as React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import {
  Bell, Users, Megaphone, Briefcase, DoorOpen, CalendarDays, MessageCircleQuestion, Building2, UsersRound,
} from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { colors, radius, spacing } from "@/lib/theme";

interface Card { key: string; label: string; Icon: typeof Bell; href: Href; tint: string }

const CARDS: Card[] = [
  { key: "notificaciones", label: "Notificaciones", Icon: Bell, href: "/notificaciones", tint: colors.brand },
  { key: "visitantes", label: "Visitantes", Icon: Users, href: "/visitantes", tint: colors.blue },
  { key: "avisos", label: "Avisos", Icon: Megaphone, href: "/avisos", tint: colors.violet },
  { key: "staff", label: "Staff", Icon: Briefcase, href: "/staff", tint: colors.amber },
  { key: "visitas", label: "Visitas", Icon: DoorOpen, href: "/(tabs)/visitas", tint: colors.green },
  { key: "reservaciones", label: "Reservaciones", Icon: Building2, href: "/reservaciones", tint: colors.pink },
  { key: "sugerencias", label: "Sugerencias", Icon: MessageCircleQuestion, href: "/sugerencias", tint: colors.cyan },
  { key: "eventos", label: "Eventos", Icon: CalendarDays, href: "/eventos", tint: colors.red },
  { key: "familiares", label: "Familiares", Icon: UsersRound, href: "/familiares", tint: colors.blue },
];

export default function HomeScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Responsive: en tablet (≥768) usamos 3 columnas y márgenes amplios; en teléfono, 2.
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const cols = isTablet ? 3 : 2;
  const horizontalPad = isTablet ? spacing.xl * 2 : spacing.lg;
  const gap = spacing.md;
  const colWidth = (width - horizontalPad * 2 - gap * (cols - 1)) / cols;

  function open(card: Card) {
    router.push(card.href);
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.md, paddingHorizontal: horizontalPad }]}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>KG-<Text style={{ color: colors.brand }}>Visit</Text></Text>
          </View>
          <Text style={styles.hi}>Hola,</Text>
          <Text style={styles.name} numberOfLines={1}>{profile?.name ?? "Residente"}</Text>
          <Text style={styles.house} numberOfLines={2}>
            {profile?.houseAddress ?? "Sin domicilio"}
            {profile?.residentialName ? `  ·  ${profile.residentialName}` : ""}
          </Text>
          <View style={styles.accent} />
        </View>

        <View style={[styles.grid, { paddingHorizontal: horizontalPad, gap }]}>
          {CARDS.map((c) => (
            <Pressable
              key={c.key}
              style={({ pressed }) => [
                styles.card,
                { width: colWidth, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => open(c)}
            >
              <View style={[styles.iconWrap, { backgroundColor: c.tint + "22" }]}>
                <c.Icon color={c.tint} size={34} strokeWidth={2} />
              </View>
              <Text style={styles.cardLabel}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingBottom: spacing.xl },
  brandRow: { marginBottom: spacing.lg },
  brand: { color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: 0.3 },
  hi: { color: colors.textMuted, fontSize: 14, fontWeight: "500" },
  name: { color: colors.text, fontSize: 28, fontWeight: "800", marginTop: 2, letterSpacing: -0.3 },
  house: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
  accent: { marginTop: spacing.md, height: 3, width: 60, borderRadius: 999, backgroundColor: colors.brand },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 144,
    alignItems: "flex-start",
    justifyContent: "space-between",
    // sombra sutil
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  cardLabel: { fontSize: 15, fontWeight: "700", color: colors.text, letterSpacing: 0.1 },
});
