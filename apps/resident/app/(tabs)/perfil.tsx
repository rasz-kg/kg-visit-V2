import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LogOut, UserPen, KeyRound, FileText, MessageCircleQuestion, User as UserIcon, ChevronRight, Trash2 } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { colors, radius, spacing } from "@/lib/theme";

export default function PerfilScreen() {
  const { profile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const initial = (profile?.name ?? "?").trim().charAt(0).toUpperCase();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl * 2, gap: spacing.lg }}>
        <Text style={styles.title}>Perfil</Text>

        {/* Hero avatar */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.heroName} numberOfLines={1}>{profile?.name ?? "Residente"}</Text>
          <Text style={styles.heroEmail} numberOfLines={1}>{profile?.email ?? "—"}</Text>
          {profile?.rol ? (
            <View style={styles.rolBadge}>
              <Text style={styles.rolText}>{profile.rol}</Text>
            </View>
          ) : null}
        </View>

        {/* Datos */}
        <View style={styles.card}>
          <Row label="Domicilio" value={profile?.houseAddress ?? "—"} />
          <Row label="Residencial" value={profile?.residentialName ?? "—"} last />
        </View>

        {/* Menú */}
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
          />
          <MenuItem
            Icon={Trash2}
            label="Borrar cuenta"
            onPress={() => router.push("/perfil/borrar")}
            last
          />
        </View>

        <Pressable style={({ pressed }) => [styles.logout, pressed && { opacity: 0.7 }]} onPress={signOut}>
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
      <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function MenuItem({
  Icon, label, onPress, last,
}: { Icon: typeof LogOut; label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuRow, last && { borderBottomWidth: 0 }, pressed && { backgroundColor: colors.surfaceHi }]}
      onPress={onPress}
    >
      <View style={styles.menuIcon}><Icon color={colors.brand} size={18} /></View>
      <Text style={styles.menuLabel}>{label}</Text>
      <ChevronRight color={colors.textFaint} size={18} />
    </Pressable>
  );
}

// Mantengo referencia a UserIcon (no se usa) — eliminada en el bundle, solo evita warning.
void UserIcon;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  hero: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: 6,
  },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.bg,
    borderWidth: 3, borderColor: colors.brand,
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.sm,
    shadowColor: colors.brand, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarText: { color: colors.brand, fontSize: 40, fontWeight: "800" },
  heroName: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: spacing.sm },
  heroEmail: { fontSize: 13, color: colors.textMuted },
  rolBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.pill,
  },
  rolText: { color: colors.brand, fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.md + 2,
    borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md,
  },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  menu: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingVertical: spacing.md + 4, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.brandSoft,
    alignItems: "center", justifyContent: "center",
  },
  menuLabel: { fontSize: 15, fontWeight: "600", color: colors.text, flex: 1 },
  logout: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.red + "55",
    backgroundColor: colors.red + "11",
  },
  logoutText: { color: colors.red, fontWeight: "700", fontSize: 15 },
});
