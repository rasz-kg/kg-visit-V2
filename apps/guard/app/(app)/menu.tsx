import * as React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { DoorOpen, LogOut, ChevronLeft } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { useBooth } from "@/lib/booth";
import { colors, radius, spacing } from "@/lib/theme";

export default function MenuScreen() {
  const { profile, signOut } = useAuth();
  const { booth, setBooth } = useBooth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  async function changeBooth() {
    await setBooth(null);
    router.replace("/(app)/casetas");
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.headerRow}>
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <ChevronLeft color={colors.text} size={26} />
        </Pressable>
        <Text style={styles.title}>Menú</Text>
      </View>

      <View style={styles.card}>
        <Row label="Guardia" value={profile?.name ?? "—"} />
        <Row label="Correo" value={profile?.email ?? "—"} />
        <Row label="Residencial" value={profile?.residentialName ?? "—"} />
        <Row label="Caseta actual" value={booth?.name ?? "—"} last />
      </View>

      <Pressable style={styles.item} onPress={changeBooth}>
        <DoorOpen color={colors.brand} size={20} />
        <Text style={styles.itemText}>Cambiar de caseta</Text>
      </Pressable>

      <Pressable style={styles.logout} onPress={signOut}>
        <LogOut color={colors.red} size={18} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  item: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, marginTop: spacing.lg,
  },
  itemText: { fontSize: 15, fontWeight: "600", color: colors.text },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.xl, paddingVertical: spacing.md },
  logoutText: { color: colors.red, fontWeight: "700", fontSize: 15 },
});
