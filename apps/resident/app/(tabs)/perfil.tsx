import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogOut } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { colors, radius, spacing } from "@/lib/theme";

export default function PerfilScreen() {
  const { profile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <Text style={styles.title}>Perfil</Text>
      <View style={styles.card}>
        <Row label="Nombre" value={profile?.name ?? "—"} />
        <Row label="Correo" value={profile?.email ?? "—"} />
        <Row label="Domicilio" value={profile?.houseAddress ?? "—"} />
        <Row label="Residencial" value={profile?.residentialName ?? "—"} />
        <Row label="Rol" value={profile?.rol ?? "—"} />
      </View>
      <Pressable style={styles.logout} onPress={signOut}>
        <LogOut color={colors.red} size={18} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.xl, paddingVertical: spacing.md },
  logoutText: { color: colors.red, fontWeight: "700", fontSize: 15 },
});
