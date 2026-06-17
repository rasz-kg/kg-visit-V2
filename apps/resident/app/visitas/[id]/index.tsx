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
      <Header onBack={() => router.back()} insetTop={insets.top} title={`Folio ${visit.folio ?? "—"}`} />
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 }}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.subject} numberOfLines={2}>{visit.subject || who}</Text>
            <View style={[styles.badge, { backgroundColor: st.color + "22" }]}>
              <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>
          <Field label="Tipo" value={visit.kind} />
          <Field label="Persona" value={who} />
          <Field label="Transporte" value={visit.transportName ?? "—"} />
          <Field label="Placa" value={visit.plateNumber ?? "—"} />
          <Field label="Domicilio" value={visit.houseAddress ?? "—"} />
          <Field label="Llegada" value={formatDate(visit.arriveDate)} />
          <Field label="Entrada" value={formatDate(visit.enterDate)} />
          <Field label="Salida" value={formatDate(visit.leaveDate)} />
          <Field label="Vencimiento" value={formatDate(visit.dueDate)} />
          <Field label="Vigencia" value={visit.validity != null ? `${visit.validity} h` : "—"} />
          <Field label="Privada" value={visit.private ? "Sí" : "No"} />
          {visit.details ? <Field label="Detalles" value={visit.details} /> : null}
          {visit.guardReport ? (
            <View style={styles.flagRow}>
              <Flag color={colors.red} size={14} />
              <Text style={styles.flagText}>Marcada como reportada</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => router.push(`/visitas/${visit.id}/qr`)}
        >
          <QrCode color="#fff" size={18} />
          <Text style={styles.btnPrimaryText}>Ver pase / QR</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnGhost, (busy || isClosed) && { opacity: 0.5 }]}
          onPress={confirmCancel}
          disabled={busy || isClosed}
        >
          <XCircle color={colors.red} size={18} />
          <Text style={[styles.btnGhostText, { color: colors.red }]}>Cancelar visita</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnGhost, (busy || visit.guardReport) && { opacity: 0.5 }]}
          onPress={doReport}
          disabled={busy || !!visit.guardReport}
        >
          <Flag color={colors.amber} size={18} />
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
        <ChevronLeft color="#fff" size={26} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.ink, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  subject: { flex: 1, fontSize: 17, fontWeight: "800", color: colors.text, marginRight: spacing.sm },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  field: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, gap: spacing.md },
  fieldLabel: { color: colors.textMuted, fontSize: 13 },
  fieldValue: { color: colors.text, fontSize: 13, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  flagRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  flagText: { color: colors.red, fontSize: 12, fontWeight: "700" },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    paddingVertical: spacing.md + 2, borderRadius: radius.md,
  },
  btnPrimary: { backgroundColor: colors.brand },
  btnPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  btnGhost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  btnGhostText: { fontWeight: "700", fontSize: 15 },
});
