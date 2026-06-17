import * as React from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert,
  TextInput, Modal, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft, Check, X, LogIn, LogOut, Flag, AlertTriangle,
  Clock, DoorOpen, DoorClosed, Bell, BellRing, QrCode, ChevronRight,
  type LucideIcon,
} from "lucide-react-native";
import {
  getVisitById, authorizeVisit, denyVisit, giveAccess, leaveVisit,
  reportIncident, notifyHouseResident, notifyHouseResidentUrgent,
  formatDate, type VisitDetail,
} from "@/lib/data";
import { colors, radius, spacing, useIsTablet, VISIT_KIND, VISIT_STATUS } from "@/lib/theme";

// Pantalla 5 — Detalle de visita. Hero naranja con folio y status, secciones
// de campos en cards (title gris arriba + valor abajo), acciones en pills.
// El botón "Reportar" abre un modal con 3 acciones (incidencia, anuncio,
// urgencia) que escriben directamente en Supabase.
type ReportMode = "incident" | "notify" | "urgent";

export default function VisitaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isTablet = useIsTablet();

  const [visit, setVisit] = React.useState<VisitDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  // Modal de "Reportar" — primero muestra las 3 opciones, luego el formulario.
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportMode, setReportMode] = React.useState<ReportMode | null>(null);
  const [reportText, setReportText] = React.useState("");

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

  function openReport() {
    setReportMode(null);
    setReportText("");
    setReportOpen(true);
  }

  function chooseMode(mode: ReportMode) {
    setReportMode(mode);
    // Sugerencia inicial editable según el modo elegido.
    if (mode === "incident") setReportText("");
    else if (mode === "notify") setReportText(`El visitante ${visit?.who ?? ""} está en la caseta`);
    else setReportText(`Se requiere tu atención: visita de ${visit?.who ?? ""}`);
  }

  function backToModes() {
    setReportMode(null);
    setReportText("");
  }

  async function submitReport() {
    if (!visit || !reportMode) return;
    const text = reportText.trim();
    if (reportMode === "incident" && !text) {
      Alert.alert("Falta el motivo", "Escribe el motivo de la incidencia.");
      return;
    }
    setBusy(true);
    let result: { error?: string };
    let okMsg = "";
    if (reportMode === "incident") {
      result = await reportIncident(visit.id, text);
      okMsg = "Incidencia reportada";
    } else if (reportMode === "notify") {
      result = await notifyHouseResident(visit.id, text || undefined);
      okMsg = "Aviso enviado al colono";
    } else {
      result = await notifyHouseResidentUrgent(visit.id, text || undefined);
      okMsg = "Alerta enviada al responsable";
    }
    setBusy(false);
    if (result.error) {
      Alert.alert("No se pudo completar", result.error);
      return;
    }
    setReportOpen(false);
    setReportMode(null);
    setReportText("");
    Alert.alert(okMsg, "Quedó registrado.");
    load();
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
          <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color="#fff" size={24} />
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
      {/* Hero naranja */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
          <View style={styles.headerTop}>
            <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft color="#fff" size={24} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>Folio · {visit.folio ?? "—"}</Text>
              <Text style={styles.title} numberOfLines={1}>{visit.subject || visit.who}</Text>
              <Text style={styles.subtitle}>{kindLabel}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{st.label}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
          isTablet && { padding: spacing.xl, maxWidth: 1200, alignSelf: "center", width: "100%" },
        ]}
      >
        {/* Datos del visitante / origen */}
        <Card title="Quién">
          <Row label="Nombre" value={visit.who} />
          {visit.visitorPhone && <Row label="Teléfono" value={visit.visitorPhone} />}
          {visit.visitorCompany && <Row label="Empresa" value={visit.visitorCompany} />}
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
              {visit.guardReport && <FlagChip label="Reportada por guardia" />}
            </View>
          </Card>
        )}

        {/* Fotos */}
        {visit.photos.length > 0 && (
          <Card title={`Fotos (${visit.photos.length})`}>
            <View style={styles.photosGrid}>
              {visit.photos.map((p) => {
                // Si el url incluye un anchor con la etiqueta (uploadVisitPhoto)
                // la separamos para mostrar como caption.
                const [src, hash] = p.url.split("#");
                const label = hash ? decodeURIComponent(hash) : null;
                const isHttp = /^https?:\/\//i.test(src) || src.startsWith("file://") || src.startsWith("data:");
                return (
                  <View key={p.id} style={styles.photoTile}>
                    {isHttp ? (
                      <Image source={{ uri: src }} style={styles.photoImg} />
                    ) : (
                      <View style={[styles.photoImg, styles.photoFallback]}>
                        <Text style={styles.photoFallbackText} numberOfLines={3}>{src}</Text>
                      </View>
                    )}
                    {label && <Text style={styles.photoCaption}>{label}</Text>}
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Historial cronológico */}
        <Card title="Historial">
          <Timeline visit={visit} />
        </Card>

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
          <ActionBtn icon={QrCode} label="Emitir QR" tone="amber" busy={busy}
            onPress={() => router.push(`/(app)/visitas/${visit.id}/qr-emit`)} />
          <ActionBtn icon={Flag} label="Reportar visita" tone="muted" busy={busy}
            onPress={openReport} />
        </View>
      </ScrollView>

      {/* Modal "Reportar" — paso 1: 3 opciones, paso 2: formulario contextual */}
      <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setReportOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {reportMode === null ? (
              <>
                <Text style={styles.modalTitle}>Reportar visita</Text>
                <Text style={styles.modalHint}>Selecciona la acción que necesitas.</Text>
                <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
                  <ReportOption
                    icon={AlertTriangle}
                    title="Reportar incidencia"
                    hint="Registrar un motivo de incidente formal"
                    tone="red"
                    onPress={() => chooseMode("incident")}
                  />
                  <ReportOption
                    icon={Bell}
                    title="Anunciar al colono"
                    hint="Avisar al residente que la visita llegó"
                    tone="brand"
                    onPress={() => chooseMode("notify")}
                  />
                  <ReportOption
                    icon={BellRing}
                    title="Avisar al responsable"
                    hint="Notificación urgente — requiere atención"
                    tone="amber"
                    onPress={() => chooseMode("urgent")}
                  />
                </View>
                <View style={[styles.modalActions, { marginTop: spacing.md }]}>
                  <Pressable style={styles.modalBtnGhost} onPress={() => setReportOpen(false)}>
                    <Text style={{ color: colors.text, fontWeight: "700" }}>Cerrar</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>
                  {reportMode === "incident" ? "Reportar incidencia"
                    : reportMode === "notify" ? "Anunciar al colono"
                    : "Avisar al responsable"}
                </Text>
                <Text style={styles.modalHint}>
                  {reportMode === "incident"
                    ? "Describe el motivo del incidente. Quedará en el historial."
                    : reportMode === "notify"
                    ? "Mensaje que verá el residente vinculado a la casa."
                    : "Mensaje de atención inmediata para el residente."}
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={reportText}
                  onChangeText={setReportText}
                  placeholder={reportMode === "incident" ? "Ej. Placa no coincide con el registro" : "Mensaje"}
                  placeholderTextColor={colors.textFaint}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.modalActions}>
                  <Pressable style={styles.modalBtnGhost} onPress={backToModes}>
                    <Text style={{ color: colors.text, fontWeight: "700" }}>Atrás</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalBtnPrimary}
                    onPress={submitReport}
                    disabled={busy}
                  >
                    {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "800" }}>Guardar</Text>}
                  </Pressable>
                </View>
              </>
            )}
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

// Línea de tiempo cronológica: llegada → entrada → salida. Cada hito muestra
// label + valor formateado en es-MX. Si un hito está vacío, lo marca como
// "Pendiente" con tono apagado. El dot toma el color del estado real (ámbar
// para llegada, verde para entrada, azul para salida) cuando hay fecha.
function Timeline({ visit }: { visit: VisitDetail }) {
  const events: { icon: LucideIcon; label: string; value: string | null; color: string }[] = [
    { icon: Clock, label: "Llegada", value: visit.arriveDate, color: colors.amber },
    { icon: DoorOpen, label: "Entrada", value: visit.enterDate, color: colors.green },
    { icon: DoorClosed, label: "Salida", value: visit.leaveDate, color: colors.blue },
  ];
  return (
    <View style={styles.timeline}>
      {events.map((e, idx) => {
        const Icon = e.icon;
        const isLast = idx === events.length - 1;
        const present = !!e.value;
        const dotColor = present ? e.color : colors.border;
        return (
          <View key={e.label} style={styles.tlRow}>
            <View style={styles.tlGutter}>
              <View style={[styles.tlDot, { backgroundColor: dotColor }]}>
                <Icon color={present ? "#fff" : colors.textFaint} size={12} />
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.tlLine,
                    present && { backgroundColor: e.color + "55" },
                  ]}
                />
              )}
            </View>
            <View style={styles.tlBody}>
              <Text style={styles.tlLabel}>{e.label}</Text>
              <Text style={[styles.tlValue, !present && { color: colors.textFaint, fontWeight: "500" }]}>
                {present ? formatDate(e.value) : "Pendiente"}
              </Text>
            </View>
          </View>
        );
      })}
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
      style={({ pressed }) => [
        styles.action,
        outline ? { borderColor: color, borderWidth: 1, backgroundColor: "#fff" } : { backgroundColor: color },
        pressed && { opacity: 0.85 },
      ]}
      onPress={onPress}
      disabled={busy}
    >
      <Icon color={outline ? color : "#fff"} size={16} />
      <Text style={[styles.actionText, { color: outline ? color : "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

// Card grande para cada una de las 3 opciones del modal "Reportar".
function ReportOption({
  icon: Icon, title, hint, tone, onPress,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  tone: "red" | "brand" | "amber";
  onPress: () => void;
}) {
  const color = tone === "red" ? colors.red : tone === "amber" ? colors.amber : colors.brand;
  return (
    <Pressable
      style={({ pressed }) => [styles.reportOption, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
      onPress={onPress}
    >
      <View style={[styles.reportOptionIcon, { backgroundColor: color + "22" }]}>
        <Icon color={color} size={22} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.reportOptionTitle}>{title}</Text>
        <Text style={styles.reportOptionHint}>{hint}</Text>
      </View>
      <ChevronRight color={colors.textFaint} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.brand, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
  },
  headerInner: { gap: spacing.md },
  headerInnerTablet: { maxWidth: 1200, width: "100%", alignSelf: "center" },
  headerTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  backBtn: {
    width: 38, height: 38, borderRadius: radius.pill,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.headerOverlay,
  },
  kicker: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  title: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 2 },
  subtitle: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2, fontWeight: "500" },
  statusPill: {
    backgroundColor: colors.headerOverlayStrong,
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: "#fff",
  },
  statusPillText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl, paddingHorizontal: spacing.xl },

  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#0f172a", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  gridRow: { flexDirection: "row", gap: spacing.md },
  cardTitle: { fontSize: 12, fontWeight: "800", color: colors.textFaint, textTransform: "uppercase", letterSpacing: 0.6 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  rowLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "500" },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: "700", maxWidth: "65%", textAlign: "right" },
  faint: { color: colors.textFaint, fontSize: 13 },
  flagsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  flagChip: { backgroundColor: colors.brandSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  flagChipText: { fontSize: 11, color: colors.brandDark, fontWeight: "800" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  action: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10,
  },
  actionText: { fontSize: 14, fontWeight: "800" },

  // Fotos
  photosGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  photoTile: { width: "47%", gap: 4 },
  photoImg: { aspectRatio: 1, borderRadius: radius.md, backgroundColor: "#0f172a" },
  photoFallback: { alignItems: "center", justifyContent: "center", padding: spacing.sm },
  photoFallbackText: { color: colors.textFaint, fontSize: 10, textAlign: "center" },
  photoCaption: { fontSize: 11, color: colors.textMuted, textAlign: "center", fontWeight: "600" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "center", padding: spacing.xl },
  modalCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.sm,
    maxWidth: 520, alignSelf: "center", width: "100%",
    shadowColor: "#0f172a", shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  modalHint: { color: colors.textMuted, fontSize: 13 },
  modalInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 14, color: colors.text,
    backgroundColor: colors.bg, minHeight: 110, textAlignVertical: "top", marginTop: spacing.sm,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md },
  modalBtnGhost: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff",
  },
  modalBtnPrimary: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },

  // Opciones del modal "Reportar"
  reportOption: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, borderRadius: radius.lg,
  },
  reportOptionIcon: {
    width: 44, height: 44, borderRadius: radius.pill,
    alignItems: "center", justifyContent: "center",
  },
  reportOptionTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  reportOptionHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  // Línea de tiempo (Historial)
  timeline: { marginTop: spacing.sm, gap: 0 },
  tlRow: { flexDirection: "row", gap: spacing.md, alignItems: "stretch" },
  tlGutter: { alignItems: "center", width: 28 },
  tlDot: {
    width: 26, height: 26, borderRadius: radius.pill,
    alignItems: "center", justifyContent: "center",
  },
  tlLine: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2, marginBottom: 2, borderRadius: 1 },
  tlBody: { flex: 1, paddingBottom: spacing.md },
  tlLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  tlValue: { color: colors.text, fontSize: 14, fontWeight: "700", marginTop: 2 },
});
