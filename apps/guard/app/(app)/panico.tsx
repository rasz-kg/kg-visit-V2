import * as React from "react";
import {
  View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, AlertTriangle, Check, MapPin, Phone, BellRing } from "lucide-react-native";
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
      {/* Header naranja con icono de campana de pánico */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color="#fff" size={24} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Alertas de pánico</Text>
            <Text style={styles.subtitle}>{alerts.length} activa{alerts.length === 1 ? "" : "s"}</Text>
          </View>
          <View style={styles.headerIcon}>
            <AlertTriangle color="#fff" size={22} />
          </View>
        </View>
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
          contentContainerStyle={[
            { padding: spacing.md, gap: spacing.md },
            isTablet && { padding: spacing.xl, maxWidth: 1200, alignSelf: "center", width: "100%" },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}><BellRing color={colors.green} size={32} /></View>
              <Text style={styles.empty}>No hay alertas activas. Todo en calma.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, isTablet && { flex: 1 }]}>
              <View style={styles.cardTop}>
                <View style={styles.iconWrap}><BellRing color={colors.red} size={22} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.userName ?? "Residente"}</Text>
                  <Text style={styles.cardSubtitle}>{item.houseAddress ?? "Sin domicilio"}</Text>
                </View>
                <View style={styles.badge}><Text style={styles.badgeText}>{item.kind ?? "Pánico"}</Text></View>
              </View>
              <Text style={styles.timeBig}>{formatDate(item.createdAt)}</Text>
              <View style={styles.metaRows}>
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
              </View>
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
  header: { backgroundColor: colors.brand, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  headerInner: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerInnerTablet: { maxWidth: 1200, width: "100%", alignSelf: "center" },
  backBtn: {
    width: 38, height: 38, borderRadius: radius.pill,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.headerOverlay,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  subtitle: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2, fontWeight: "600" },
  headerIcon: {
    width: 44, height: 44, borderRadius: radius.pill,
    backgroundColor: colors.headerOverlayStrong, borderWidth: 1, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },

  emptyWrap: { alignItems: "center", marginTop: spacing.xl * 2, paddingHorizontal: spacing.xl },
  emptyIcon: {
    width: 72, height: 72, borderRadius: radius.pill,
    backgroundColor: colors.green + "1a", alignItems: "center", justifyContent: "center", marginBottom: spacing.md,
  },
  empty: { textAlign: "center", color: colors.textMuted, fontSize: 15, fontWeight: "600" },

  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1.5, borderColor: colors.red + "55",
    shadowColor: colors.red, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 2, gap: spacing.sm,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconWrap: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: colors.red + "1a", alignItems: "center", justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  cardSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge: { backgroundColor: colors.red + "1a", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, color: colors.red, fontWeight: "800", textTransform: "uppercase" },

  timeBig: { fontSize: 22, fontWeight: "800", color: colors.red, marginTop: spacing.sm },
  metaRows: { gap: spacing.xs },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 2 },
  metaValue: { color: colors.text, fontSize: 13, fontWeight: "600" },

  attendBtn: {
    marginTop: spacing.sm, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: colors.red, borderRadius: radius.pill, paddingVertical: spacing.md,
    shadowColor: colors.red, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  attendText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
