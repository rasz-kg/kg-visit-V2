import * as React from "react";
import {
  View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, AlertTriangle, Check, MapPin, Phone } from "lucide-react-native";
import {
  getActivePanicAlerts, markPanicAttended, formatDate, type PanicAlertRow,
} from "@/lib/data";
import { colors, radius, spacing, useIsTablet } from "@/lib/theme";

// Pantalla 14 — Pánico. Lista las alertas activas del tenant que aún no han
// sido atendidas (panic_alerts.status = true) y permite marcarlas como vistas.
// La RLS de guardia (migración 0006) ya permite SELECT y UPDATE sobre la tabla.
export default function PanicoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isTablet = useIsTablet();

  const [alerts, setAlerts] = React.useState<PanicAlertRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [actingId, setActingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const data = await getActivePanicAlerts();
    setAlerts(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function attend(id: string) {
    setActingId(id);
    const res = await markPanicAttended(id);
    setActingId(null);
    if (res.error) { Alert.alert("No se pudo marcar como atendida", res.error); return; }
    load();
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.back}><ChevronLeft color="#fff" size={26} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Alertas de pánico</Text>
          <Text style={styles.subtitle}>{alerts.length} activa{alerts.length === 1 ? "" : "s"}</Text>
        </View>
        <AlertTriangle color={colors.red} size={24} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(a) => a.id}
          numColumns={isTablet ? 2 : 1}
          key={isTablet ? "grid-2" : "list-1"}
          columnWrapperStyle={isTablet ? { gap: spacing.md } : undefined}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay alertas activas. Todo en calma.</Text>}
          renderItem={({ item }) => (
            <View style={[styles.card, isTablet && { flex: 1 }]}>
              <View style={styles.cardTop}>
                <View style={styles.iconWrap}><AlertTriangle color={colors.red} size={20} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.userName ?? "Residente"}</Text>
                  <Text style={styles.cardSubtitle}>{item.houseAddress ?? "Sin domicilio"}</Text>
                </View>
                <View style={styles.badge}><Text style={styles.badgeText}>{item.kind ?? "Pánico"}</Text></View>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Disparada</Text>
                <Text style={styles.metaValue}>{formatDate(item.createdAt)}</Text>
              </View>
              {item.userPhone && (
                <View style={styles.metaRow}>
                  <Phone color={colors.textMuted} size={14} />
                  <Text style={styles.metaValue}>{item.userPhone}</Text>
                </View>
              )}
              {(item.lat != null && item.lng != null) && (
                <View style={styles.metaRow}>
                  <MapPin color={colors.textMuted} size={14} />
                  <Text style={styles.metaValue}>{item.lat.toFixed(5)}, {item.lng.toFixed(5)}</Text>
                </View>
              )}
              <Pressable
                style={[styles.attendBtn, actingId === item.id && { opacity: 0.5 }]}
                onPress={() => attend(item.id)}
                disabled={actingId === item.id}
              >
                {actingId === item.id ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Check color="#fff" size={18} />
                    <Text style={styles.attendText}>Marcar atendida</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.ink, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
  },
  back: { padding: 4 },
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  subtitle: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl, paddingHorizontal: spacing.xl },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.red + "55",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  iconWrap: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.red + "22", alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  cardSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  badge: { backgroundColor: colors.red + "22", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: colors.red, fontWeight: "700", textTransform: "uppercase" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 4 },
  metaLabel: { color: colors.textMuted, fontSize: 12, width: 70 },
  metaValue: { color: colors.text, fontSize: 13, fontWeight: "600" },
  attendBtn: {
    marginTop: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: colors.red, borderRadius: radius.md, paddingVertical: spacing.md,
  },
  attendText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
