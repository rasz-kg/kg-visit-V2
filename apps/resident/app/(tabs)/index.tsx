import * as React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, Users, Megaphone, Briefcase, DoorOpen, CalendarDays } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { colors, radius, spacing } from "@/lib/theme";

const CARDS = [
  { key: "notificaciones", label: "Notificaciones", Icon: Bell },
  { key: "visitantes", label: "Visitantes", Icon: Users },
  { key: "avisos", label: "Avisos", Icon: Megaphone },
  { key: "staff", label: "Staff", Icon: Briefcase },
  { key: "visitas", label: "Visitas", Icon: DoorOpen },
  { key: "eventos", label: "Eventos", Icon: CalendarDays },
];

export default function HomeScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.hi}>Hola,</Text>
        <Text style={styles.name}>{profile?.name ?? "Residente"}</Text>
        <Text style={styles.house}>{profile?.houseAddress ?? "Sin domicilio"} · {profile?.residentialName ?? ""}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {CARDS.map(({ key, label, Icon }) => (
          <View key={key} style={styles.card}>
            <View style={styles.iconWrap}><Icon color={colors.brand} size={24} /></View>
            <Text style={styles.cardLabel}>{label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.ink, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  hi: { color: colors.textFaint, fontSize: 14 },
  name: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 2 },
  house: { color: colors.textFaint, fontSize: 13, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: spacing.md, gap: spacing.md },
  card: {
    width: "47%", backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.brandSoft,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.md,
  },
  cardLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
});
