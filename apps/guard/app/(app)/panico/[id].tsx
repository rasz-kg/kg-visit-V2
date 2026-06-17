import * as React from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft, BellRing, Check, User2, Home, MapPin, Phone, Clock, ShieldCheck,
} from "lucide-react-native";
import {
  getPanicAlertById, markPanicAttended, formatDate, type PanicAlertRow,
} from "@/lib/data";
import { colors, radius, spacing, useIsTablet } from "@/lib/theme";

// Pantalla 14b — Detalle de una alerta de pánico. Hero naranja con BellRing
// grande, cards con quién/dónde/cuándo y CTA "Marcar atendida" (verde si
// activa). La RLS de guardia permite UPDATE sobre `panic_alerts`.
export default function PanicoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isTablet = useIsTablet();

  const [alert, setAlert] = React.useState<PanicAlertRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!id) return;
    const data = await getPanicAlertById(String(id));
    setAlert(data);
    setLoading(false);
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  async function attend() {
    if (!alert) return;
    setBusy(true);
    const res = await markPanicAttended(alert.id);
    setBusy(false);
    if (res.error) { Alert.alert("No se pudo marcar como atendida", res.error); return; }
    Alert.alert("Alerta atendida", "La alerta quedó marcada como atendida.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }
  if (!alert) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
            <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft color="#fff" size={24} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Alerta no encontrada</Text>
            </View>
          </View>
        </View>
        <Text style={styles.empty}>La alerta no existe o no tienes acceso.</Text>
      </View>
    );
  }

  const isActive = alert.status === true;
  const hasLat = alert.lat != null;
  const hasLng = alert.lng != null;

  return (
    <View style={styles.root}>
      {/* Hero naranja con BellRing grande */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
          <View style={styles.headerTopRow}>
            <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft color="#fff" size={24} />
            </Pressable>
            <View style={[styles.statusPill, !isActive && styles.statusPillAttended]}>
              <Text style={styles.statusPillText}>
                {isActive ? "Activa" : "Atendida"}
              </Text>
            </View>
          </View>
          <View style={styles.heroBody}>
            <View style={styles.heroIcon}>
              <BellRing color="#fff" size={42} />
            </View>
            <Text style={styles.heroTitle}>Alerta de pánico</Text>
            <Text style={styles.heroSubtitle}>{formatDate(alert.createdAt)}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={[
        { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
        isTablet && { padding: spacing.xl, maxWidth: 720, alignSelf: "center", width: "100%" },
      ]}>
        {/* Quién disparó */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quién disparó la alerta</Text>
          <DetailRow
            icon={User2}
            label="Residente"
            value={alert.userName ?? "Sin nombre"}
          />
          {alert.userPhone && (
            <DetailRow
              icon={Phone}
              label="Teléfono"
              value={alert.userPhone}
              last
            />
          )}
        </View>

        {/* Casa */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Domicilio</Text>
          <DetailRow
            icon={Home}
            label="Dirección"
            value={alert.houseAddress ?? "Sin domicilio"}
            last
          />
        </View>

        {/* Ubicación y tiempo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles</Text>
          <DetailRow
            icon={Clock}
            label="Fecha y hora"
            value={formatDate(alert.createdAt)}
          />
          {alert.kind && (
            <DetailRow
              icon={ShieldCheck}
              label="Tipo"
              value={alert.kind}
            />
          )}
          {(hasLat && hasLng) ? (
            <DetailRow
              icon={MapPin}
              label="Ubicación"
              value={`${alert.lat!.toFixed(5)}, ${alert.lng!.toFixed(5)}`}
              last
            />
          ) : null}
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          {isActive && (
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: colors.green },
                pressed && { opacity: 0.85 },
                busy && { opacity: 0.5 },
              ]}
              onPress={attend}
              disabled={busy}
            >
              {busy ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Check color="#fff" size={18} />
                  <Text style={styles.primaryBtnText}>Marcar atendida</Text>
                </>
              )}
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.ghostBtnText}>Volver</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  icon: Icon, label, value, last,
}: { icon: typeof User2; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <View style={styles.rowIcon}>
        <Icon color={colors.brand} size={16} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerInner: { gap: spacing.md },
  headerInnerTablet: { maxWidth: 1200, width: "100%", alignSelf: "center" },
  headerTopRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  backBtn: {
    width: 38, height: 38, borderRadius: radius.pill,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.headerOverlay,
  },
  statusPill: {
    backgroundColor: colors.headerOverlayStrong,
    borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: "#fff",
  },
  statusPillAttended: {
    backgroundColor: colors.headerOverlay,
    borderColor: "rgba(255,255,255,0.6)",
  },
  statusPillText: { color: "#fff", fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 },

  heroBody: { alignItems: "center", marginTop: spacing.md, gap: spacing.sm },
  heroIcon: {
    width: 96, height: 96, borderRadius: radius.pill,
    backgroundColor: colors.headerOverlayStrong,
    borderWidth: 2, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: spacing.sm },
  heroSubtitle: { color: "rgba(255,255,255,0.92)", fontSize: 18, fontWeight: "600" },

  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl, paddingHorizontal: spacing.xl },

  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#0f172a", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTitle: {
    fontSize: 12, fontWeight: "800", color: colors.textFaint,
    textTransform: "uppercase", letterSpacing: 0.6, marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    alignItems: "center", justifyContent: "center",
  },
  rowLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  rowValue: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 2 },

  actions: { gap: spacing.sm, marginTop: spacing.sm },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: radius.pill, paddingVertical: spacing.md + 4,
    shadowColor: colors.green, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  ghostBtn: {
    backgroundColor: "#fff", borderRadius: radius.pill, paddingVertical: spacing.md + 4,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: colors.border,
  },
  ghostBtnText: { color: colors.text, fontWeight: "800", fontSize: 15 },
});
