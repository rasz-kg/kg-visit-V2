import * as React from "react";
import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, QrCode, XCircle, Flag } from "lucide-react-native";
import { cancelVisit, formatDate, getVisitDetail, reportVisit, type VisitDetail } from "@/lib/data";
import { colors, radius, spacing, VISIT_STATUS } from "@/lib/theme";

export default function VisitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [visit, setVisit] = React.useState<VisitDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const v = await getVisitDetail(id);
    setVisit(v);
    setLoading(false);
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  function confirmCancel() {
    if (!id) return;
    Alert.alert("Cancelar visita", "¿Confirmas cancelarla?", [
      { text: "Volver", style: "cancel" },
      {
        text: "Cancelar visita",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          const r = await cancelVisit(id);
          setBusy(false);
          if (r.error) Alert.alert("No se pudo cancelar", r.error);
          else { Alert.alert("Visita cancelada"); load(); }
        },
      },
    ]);
  }

  async function doReport() {
    if (!id) return;
    setBusy(true);
    const r = await reportVisit(id);
    setBusy(false);
    if (r.error) Alert.alert("No se pudo reportar", r.error);
    else { Alert.alert("Visita reportada", "La caseta verá la observación."); load(); }
  }

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  if (!visit) {
    return (
      <View style={styles.root}>
        <Header onBack={() => router.back()} insetTop={insets.top} title="Visita" />
        <Text style={styles.empty}>No se encontró la visita.</Text>
      </View>
    );
  }

  const st = VISIT_STATUS[visit.status] ?? { label: visit.status, color: colors.textMuted };
  const who = visit.visitorName ?? visit.serviceName ?? visit.employeeName ?? "—";
  const isClosed = ["canceled", "finished", "expired"].includes(visit.status);

  return (
    <View style={styles.root}>
      <Header onBack={() => router.back()} insetTop={insets.top} title="Detalle" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 }}>
        {/* Hero con folio + status */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>FOLIO</Text>
          <Text style={styles.heroFolio}>{visit.folio ?? "—"}</Text>
          <View style={[styles.badge, { backgroundColor: st.color + "22", borderColor: st.color + "55" }]}>
            <View style={[styles.dot, { backgroundColor: st.color }]} />
            <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
          <Text style={styles.heroSubject} numberOfLines={2}>{visit.subject || who}</Text>
        </View>

        {/* CTA: ver pase / QR (encadenamiento prominente, antes de info) */}
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && { transform: [{ scale: 0.98 }] }]}
          onPress={() => router.push(`/visitas/${visit.id}/qr`)}
        >
          <QrCode color="#fff" size={22} />
          <Text style={styles.btnPrimaryText}>Ver pase / QR</Text>
        </Pressable>

        {/* Grid de campos */}
        <View style={styles.fieldGrid}>
          <FieldCard label="Tipo" value={visit.kind} />
          <FieldCard label="Persona" value={who} />
          <FieldCard label="Transporte" value={visit.transportName ?? "—"} />
          <FieldCard label="Placa" value={visit.plateNumber ?? "—"} />
          <FieldCard label="Domicilio" value={visit.houseAddress ?? "—"} wide />
          <FieldCard label="Llegada" value={formatDate(visit.arriveDate)} />
          <FieldCard label="Vigencia" value={visit.validity != null ? `${visit.validity} h` : "—"} />
          <FieldCard label="Entrada" value={formatDate(visit.enterDate)} />
          <FieldCard label="Salida" value={formatDate(visit.leaveDate)} />
          <FieldCard label="Vencimiento" value={formatDate(visit.dueDate)} wide />
          <FieldCard label="Privada" value={visit.private ? "Sí" : "No"} />
        </View>

        {visit.details ? (
          <View style={styles.detailsCard}>
            <Text style={styles.fieldLabel}>Detalles</Text>
            <Text style={styles.detailsText}>{visit.details}</Text>
          </View>
        ) : null}

        {visit.guardReport ? (
          <View style={styles.flagRow}>
            <Flag color={colors.red} size={14} />
            <Text style={styles.flagText}>Marcada como reportada</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.btn, styles.btnGhost, (busy || isClosed) && { opacity: 0.4 }]}
          onPress={confirmCancel}
          disabled={busy || isClosed}
        >
          <XCircle color={colors.red} size={20} />
          <Text style={[styles.btnGhostText, { color: colors.red }]}>Cancelar visita</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnGhost, (busy || visit.guardReport) && { opacity: 0.4 }]}
          onPress={doReport}
          disabled={busy || !!visit.guardReport}
        >
          <Flag color={colors.amber} size={20} />
          <Text style={[styles.btnGhostText, { color: colors.amber }]}>Reportar visita</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Header({ onBack, insetTop, title }: { onBack: () => void; insetTop: number; title: string }) {
  return (
    <View style={[styles.header, { paddingTop: insetTop + spacing.sm }]}>
      <Pressable onPress={onBack} style={{ padding: 4 }}>
        <ChevronLeft color={colors.text} size={26} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

function FieldCard({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.fieldCard, wide ? { width: "100%" } : { width: "48.5%" }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: "800" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  heroLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  heroFolio: { color: colors.brand, fontSize: 42, fontWeight: "900", letterSpacing: 2, marginTop: 4 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1,
    marginTop: spacing.md,
  },
  badgeText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  heroSubject: { color: colors.text, fontSize: 16, fontWeight: "700", marginTop: spacing.md, textAlign: "center" },
  fieldGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  fieldCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md + 2,
  },
  fieldLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.7, textTransform: "uppercase" },
  fieldValue: { color: colors.text, fontSize: 14, fontWeight: "600", marginTop: 4 },
  detailsCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg,
  },
  detailsText: { color: colors.text, fontSize: 14, marginTop: 6, lineHeight: 20 },
  flagRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.red + "15",
    borderColor: colors.red + "55", borderWidth: 1,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: radius.pill, alignSelf: "flex-start",
  },
  flagText: { color: colors.red, fontSize: 12, fontWeight: "700" },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    paddingVertical: spacing.md + 4, borderRadius: radius.pill,
  },
  btnPrimary: {
    backgroundColor: colors.brand,
    shadowColor: colors.brand, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.3 },
  btnGhost: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  btnGhostText: { fontWeight: "700", fontSize: 15 },
});
