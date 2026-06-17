import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LogOut, UserPen, KeyRound, FileText, MessageCircleQuestion } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { colors, radius, spacing } from "@/lib/theme";

export default function PerfilScreen() {
  const { profile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <Text style={styles.title}>Perfil</Text>
        <View style={styles.card}>
          <Row label="Nombre" value={profile?.name ?? "—"} />
          <Row label="Correo" value={profile?.email ?? "—"} />
          <Row label="Domicilio" value={profile?.houseAddress ?? "—"} />
          <Row label="Residencial" value={profile?.residentialName ?? "—"} />
          <Row label="Rol" value={profile?.rol ?? "—"} last />
        </View>

        <View style={styles.menu}>
          <MenuItem
            Icon={UserPen}
            label="Actualizar perfil"
            onPress={() => router.push("/perfil/editar")}
          />
          <MenuItem
            Icon={KeyRound}
            label="Cambiar contraseña"
            onPress={() => router.push("/perfil/password")}
          />
          <MenuItem
            Icon={MessageCircleQuestion}
            label="Sugerencias / quejas"
            onPress={() => router.push("/sugerencias")}
          />
          <MenuItem
            Icon={FileText}
            label="Aviso de privacidad"
            onPress={() => router.push("/perfil/avisos-privacidad")}
            last
          />
        </View>

        <Pressable style={styles.logout} onPress={signOut}>
          <LogOut color={colors.red} size={18} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
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

function MenuItem({
  Icon, label, onPress, last,
}: { Icon: typeof LogOut; label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable
      style={[styles.menuRow, last && { borderBottomWidth: 0 }]}
      onPress={onPress}
    >
      <View style={styles.menuIcon}><Icon color={colors.brand} size={18} /></View>
      <Text style={styles.menuLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  menu: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
  },
  menuRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingVertical: spacing.md + 2, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.brandSoft,
    alignItems: "center", justifyContent: "center",
  },
  menuLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
  logout: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  logoutText: { color: colors.red, fontWeight: "700", fontSize: 15 },
});
