import * as React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect, type Href } from "expo-router";
import {
  Bell, Users, Megaphone, Briefcase, DoorOpen, CalendarDays, MessageCircleQuestion, Building2, UsersRound,
} from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { getDashboardBadges } from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

type BadgeKey = "notifications" | "notices";
interface Card { key: string; label: string; Icon: typeof Bell; href: Href; tint: string; badgeKey?: BadgeKey }

const CARDS: Card[] = [
  { key: "notificaciones", label: "Notificaciones", Icon: Bell, href: "/notificaciones", tint: colors.brand, badgeKey: "notifications" },
  { key: "visitantes", label: "Visitantes", Icon: Users, href: "/visitantes", tint: colors.blue },
  { key: "avisos", label: "Avisos", Icon: Megaphone, href: "/avisos", tint: colors.violet, badgeKey: "notices" },
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

  const [badges, setBadges] = React.useState<{ notifications: number; notices: number }>({
    notifications: 0, notices: 0,
  });

  // Refresca conteos cada vez que el dashboard recibe foco.
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      getDashboardBadges(profile?.id ?? null).then((b) => { if (active) setBadges(b); });
      return () => { active = false; };
    }, [profile?.id]),
  );

  function open(card: Card) {
    router.push(card.href);
  }

  function badgeLabel(n: number): string {
    return n > 99 ? "99+" : String(n);
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
          {CARDS.map((c) => {
            const n = c.badgeKey ? badges[c.badgeKey] : 0;
            return (
              <Pressable
                key={c.key}
                style={({ pressed }) => [
                  styles.card,
                  { width: colWidth, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={() => open(c)}
              >
                <View>
                  <View style={[styles.iconWrap, { backgroundColor: c.tint + "22" }]}>
                    <c.Icon color={c.tint} size={34} strokeWidth={2} />
                  </View>
                  {n > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badgeLabel(n)}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.cardLabel}>{c.label}</Text>
              </Pressable>
            );
          })}
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
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
    shadowColor: colors.red,
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
  cardLabel: { fontSize: 15, fontWeight: "700", color: colors.text, letterSpacing: 0.1 },
});
