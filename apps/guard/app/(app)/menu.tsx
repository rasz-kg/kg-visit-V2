import * as React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { DoorOpen, LogOut, ChevronLeft, AlertTriangle, User2, Mail, Building2, ShieldCheck } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { useBooth } from "@/lib/booth";
import { countActivePanicAlerts } from "@/lib/data";
import { colors, radius, spacing, useIsTablet } from "@/lib/theme";

// Pantalla "menú" — actúa como drawer-like full screen. Tarjeta de datos del
// guardia arriba, tiles de acciones (cambiar caseta, alertas de pánico con
// badge si hay activas) y "cerrar sesión" outline naranja-rojo abajo (mismo
// patrón del menú original de VisitApp).
export default function MenuScreen() {
  const { profile, signOut } = useAuth();
  const { booth, setBooth } = useBooth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isTablet = useIsTablet();
  const [panicCount, setPanicCount] = React.useState(0);

  // Refresca el badge cada vez que la pantalla recibe foco (e.g. al volver de /panico).
  useFocusEffect(
    React.useCallback(() => {
      countActivePanicAlerts().then(setPanicCount);
    }, []),
  );

  async function changeBooth() {
    await setBooth(null);
    router.replace("/(app)/casetas");
  }

  return (
    <View style={styles.root}>
      {/* Header naranja con back */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
          <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color="#fff" size={24} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>Menú</Text>
            <Text style={styles.brandSub}>{booth?.name ?? "Sin caseta"}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          { padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xl },
          isTablet && { padding: spacing.xl, maxWidth: 720, alignSelf: "center", width: "100%" },
        ]}
      >
        {/* Tarjeta del guardia */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(profile?.name)}</Text>
          </View>
          <Text style={styles.profileName}>{profile?.name ?? "Guardia"}</Text>
          <Text style={styles.profileRole}>Guardia · {profile?.residentialName ?? "Residencial"}</Text>

          <View style={styles.profileRows}>
            <ProfileRow icon={User2} label="Guardia" value={profile?.name ?? "—"} />
            <ProfileRow icon={Mail} label="Correo" value={profile?.email ?? "—"} />
            <ProfileRow icon={Building2} label="Residencial" value={profile?.residentialName ?? "—"} />
            <ProfileRow icon={ShieldCheck} label="Caseta" value={booth?.name ?? "—"} last />
          </View>
        </View>

        {/* Tile Alertas de pánico */}
        <Pressable
          style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
          onPress={() => router.push("/(app)/panico")}
        >
          <View style={[styles.tileIcon, { backgroundColor: colors.red + "1a" }]}>
            <AlertTriangle color={colors.red} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tileTitle}>Alertas de pánico</Text>
            <Text style={styles.tileSub}>
              {panicCount > 0 ? `${panicCount} alerta${panicCount === 1 ? "" : "s"} activa${panicCount === 1 ? "" : "s"}` : "Sin alertas activas"}
            </Text>
          </View>
          {panicCount > 0 && (
            <View style={styles.panicBadge}>
              <Text style={styles.panicBadgeText}>{panicCount}</Text>
            </View>
          )}
        </Pressable>

        {/* Tile Cambiar caseta */}
        <Pressable
          style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
          onPress={changeBooth}
        >
          <View style={[styles.tileIcon, { backgroundColor: colors.brandSoft }]}>
            <DoorOpen color={colors.brand} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tileTitle}>Cambiar de caseta</Text>
            <Text style={styles.tileSub}>Vuelve a la selección de caseta del residencial</Text>
          </View>
        </Pressable>

        {/* Cerrar sesión outline naranja-rojo (espejo del original) */}
        <Pressable style={({ pressed }) => [styles.logout, pressed && { opacity: 0.85 }]} onPress={signOut}>
          <LogOut color={colors.red} size={18} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function initials(name?: string | null): string {
  if (!name) return "G";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "G";
}

function ProfileRow({
  icon: Icon, label, value, last,
}: { icon: typeof User2; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Icon color={colors.textFaint} size={14} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.brand, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  headerInner: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerInnerTablet: { maxWidth: 1200, width: "100%", alignSelf: "center" },
  backBtn: {
    width: 38, height: 38, borderRadius: radius.pill,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.headerOverlay,
  },
  brand: { color: "#fff", fontSize: 22, fontWeight: "800" },
  brandSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2, fontWeight: "600" },

  profileCard: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing.xl, alignItems: "center",
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatar: {
    width: 72, height: 72, borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: "center", justifyContent: "center",
    shadowColor: colors.brand, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 26, letterSpacing: 1 },
  profileName: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: spacing.md },
  profileRole: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  profileRows: { width: "100%", marginTop: spacing.lg },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.textMuted, fontSize: 13, width: 90 },
  rowValue: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "700", textAlign: "right" },

  tile: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: "#0f172a",
    shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tilePressed: { backgroundColor: "#f1f5f9" },
  tileIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center",
  },
  tileTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  tileSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  panicBadge: {
    backgroundColor: colors.red, borderRadius: radius.pill,
    minWidth: 28, paddingHorizontal: 10, paddingVertical: 3, alignItems: "center",
  },
  panicBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  logout: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: colors.red,
    backgroundColor: "#fff",
    marginTop: spacing.md,
  },
  logoutText: { color: colors.red, fontWeight: "800", fontSize: 14 },
});
