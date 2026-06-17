import * as React from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert,
  TextInput, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Check, X, LogIn, LogOut, Flag, AlertTriangle, type LucideIcon } from "lucide-react-native";
import {
  getVisitById, authorizeVisit, denyVisit, giveAccess, leaveVisit, reportVisit,
  createIncident, formatDate, type VisitDetail,
} from "@/lib/data";
import { colors, radius, spacing, useIsTablet, VISIT_KIND, VISIT_STATUS } from "@/lib/theme";

// Pantalla 5 — Detalle de visita. Muestra todos los campos relevantes (folio,
// estatus, casa, placa, tiempos, flags) y permite las acciones del guardia.
export default function VisitaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isTablet = useIsTablet();

  const [visit, setVisit] = React.useState<VisitDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [incidentOpen, setIncidentOpen] = React.useState(false);
  const [incidentReason, setIncidentReason] = React.useState("");

  const load = React.useCallback(async () => {
    if (!id) return;
    const v = await getVisitById(String(id));
    setVisit(v);
    setLoading(false);
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  async function runAction(fn: () => Promise<{ error?: string }>) {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res.error) {
      Alert.alert("No se pudo completar", res.error);
      return;
    }
    load();
  }

  async function submitIncident() {
    const reason = incidentReason.trim();
    if (!reason) { Alert.alert("Falta el motivo", "Escribe el motivo del incidente."); return; }
    setBusy(true);
    const res = await createIncident(String(id), reason);
    setBusy(false);
    if (res.error) {
      Alert.alert("No se pudo crear el incidente", res.error);
      return;
    }
    setIncidentOpen(false);
    setIncidentReason("");
    Alert.alert("Incidente creado", "Quedó registrado en el historial.");
  }

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }
  if (!visit) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable hitSlop={8} onPress={() => router.back()} style={styles.back}>
            <ChevronLeft color="#fff" size={26} />
          </Pressable>
          <Text style={styles.title}>Visita no encontrada</Text>
        </View>
        <Text style={styles.empty}>La visita no existe o no tienes acceso.</Text>
      </View>
    );
  }

  const st = VISIT_STATUS[visit.status] ?? { label: visit.status, color: colors.textMuted };
  const kindLabel = VISIT_KIND[visit.kind] ?? visit.kind;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable hitSlop={8} onPress={() => router.back()} style={styles.back}>
          <ChevronLeft color="#fff" size={26} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{visit.subject || visit.who}</Text>
          <Text style={styles.subtitle}>Folio {visit.folio ?? "—"} · {kindLabel}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: st.color + "22" }]}>
          <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 }}>
        {/* Datos del visitante / origen */}
        <Card title="Quién">
          <Row label="Nombre" value={visit.who} />
          {visit.visitorPhone && <Row label="Teléfono" value={visit.visitorPhone} />}
          {visit.visitorCompany && <Row label="Empresa" value={visit.visitorCompany} />}
          {visit.visitorCurp && <Row label="CURP" value={visit.visitorCurp} />}
          {visit.serviceName && <Row label="Servicio" value={visit.serviceName} />}
          {visit.employeeName && <Row label="Empleado" value={visit.employeeName} />}
        </Card>

        {/* Domicilio y vehículo */}
        <View style={isTablet ? styles.gridRow : undefined}>
          <View style={isTablet ? { flex: 1 } : undefined}>
            <Card title="Destino">
              <Row label="Domicilio" value={visit.houseAddress ?? "—"} />
              {visit.houseCluster && <Row label="Cluster" value={visit.houseCluster} />}
              <Row label="Caseta" value={visit.boothName ?? "—"} last />
            </Card>
          </View>
          <View style={isTablet ? { flex: 1 } : undefined}>
            <Card title="Vehículo">
              <Row label="Transporte" value={visit.transportName ?? "—"} />
              <Row label="Placa" value={visit.plate ?? "—"} />
              <Row label="Tipo de acceso" value={visit.accessKind ?? "—"} last />
            </Card>
          </View>
        </View>

        {/* Tiempos */}
        <Card title="Tiempos">
          <Row label="Llegada" value={formatDate(visit.arriveDate)} />
          <Row label="Entrada" value={formatDate(visit.enterDate)} />
          <Row label="Salida" value={formatDate(visit.leaveDate)} />
          <Row label="Vigencia" value={formatDate(visit.dueDate)} last />
        </Card>

        {/* Flags y notas */}
        {(visit.notes || visit.details || visit.reason || visit.quick || visit.private || visit.guardReport) && (
          <Card title="Detalles">
            {visit.details && <Row label="Detalles" value={visit.details} />}
            {visit.notes && <Row label="Notas" value={visit.notes} />}
            {visit.reason && <Row label="Motivo" value={visit.reason} />}
            <View style={styles.flagsRow}>
              {visit.quick && <FlagChip label="Rápida" />}
              {visit.private && <FlagChip label="Privada" />}
              {visit.guardReport && <FlagChip label="Creada por guardia" />}
            </View>
          </Card>
        )}

        {/* Fotos */}
        {visit.photos.length > 0 && (
          <Card title={`Fotos (${visit.photos.length})`}>
            <Text style={styles.faint}>Las fotos están almacenadas en `visit_photos`. Visualización inline próximamente.</Text>
          </Card>
        )}

        {/* Acciones */}
        <View style={styles.actions}>
          {visit.status === "pending" && (
            <>
              <ActionBtn icon={Check} label="Autorizar" tone="green" busy={busy}
                onPress={() => runAction(() => authorizeVisit(visit.id))} />
              <ActionBtn icon={X} label="Denegar" tone="red" busy={busy}
                onPress={() => runAction(() => denyVisit(visit.id))} />
            </>
          )}
          {visit.status === "authorized" && (
            <ActionBtn icon={LogIn} label="Dar acceso" tone="brand" busy={busy}
              onPress={() => runAction(() => giveAccess(visit.id))} />
          )}
          {visit.status === "inside" && (
            <ActionBtn icon={LogOut} label="Registrar salida" tone="ink" busy={busy}
              onPress={() => runAction(() => leaveVisit(visit.id))} />
          )}
          <ActionBtn icon={Flag} label="Reportar visita" tone="muted" busy={busy}
            onPress={() => runAction(() => reportVisit(visit.id))} />
          <ActionBtn icon={AlertTriangle} label="Crear incidente" tone="amber" busy={busy}
            onPress={() => setIncidentOpen(true)} />
        </View>
      </ScrollView>

      {/* Modal de incidente — Pressable overlay sin libs externas */}
      <Modal visible={incidentOpen} transparent animationType="fade" onRequestClose={() => setIncidentOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIncidentOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Crear incidente</Text>
            <Text style={styles.modalHint}>Describe el motivo del incidente para esta visita.</Text>
            <TextInput
              style={styles.modalInput}
              value={incidentReason}
              onChangeText={setIncidentReason}
              placeholder="Ej. Placa no coincide con el registro"
              placeholderTextColor={colors.textFaint}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => setIncidentOpen(false)}>
                <Text style={{ color: colors.text, fontWeight: "700" }}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.brand }]} onPress={submitIncident} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Crear</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={{ marginTop: spacing.sm }}>{children}</View>
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

function FlagChip({ label }: { label: string }) {
  return (
    <View style={styles.flagChip}>
      <Text style={styles.flagChipText}>{label}</Text>
    </View>
  );
}

type Tone = "green" | "red" | "brand" | "ink" | "muted" | "amber";
const TONE: Record<Tone, string> = {
  green: colors.green, red: colors.red, brand: colors.brand, ink: colors.ink800,
  muted: colors.textMuted, amber: colors.amber,
};

function ActionBtn({
  icon: Icon, label, tone, busy, onPress,
}: { icon: LucideIcon; label: string; tone: Tone; busy: boolean; onPress: () => void }) {
  const color = TONE[tone];
  const outline = tone === "muted";
  return (
    <Pressable
      style={[styles.action, outline ? { borderColor: color, borderWidth: 1 } : { backgroundColor: color }]}
      onPress={onPress}
      disabled={busy}
    >
      <Icon color={outline ? color : "#fff"} size={16} />
      <Text style={[styles.actionText, { color: outline ? color : "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.ink, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
  },
  back: { padding: 4 },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  subtitle: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl, paddingHorizontal: spacing.xl },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  gridRow: { flexDirection: "row", gap: spacing.md },
  cardTitle: { fontSize: 13, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  rowLabel: { color: colors.textMuted, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: "600", maxWidth: "65%", textAlign: "right" },
  faint: { color: colors.textFaint, fontSize: 13 },
  flagsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  flagChip: { backgroundColor: colors.brandSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  flagChipText: { fontSize: 11, color: colors.brandDark, fontWeight: "700" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  action: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md - 2,
  },
  actionText: { fontSize: 14, fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: spacing.xl },
  modalCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  modalHint: { color: colors.textMuted, fontSize: 13 },
  modalInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 14, color: colors.text,
    backgroundColor: colors.bg, minHeight: 100, textAlignVertical: "top", marginTop: spacing.sm,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md },
});
