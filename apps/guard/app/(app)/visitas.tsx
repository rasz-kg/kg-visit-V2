import * as React from "react";
import {
  View, Text, TextInput, FlatList, Pressable, StyleSheet, RefreshControl,
  ActivityIndicator, Alert, ScrollView, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Search, QrCode, ScanLine, Menu, Check, X, LogIn, LogOut, Flag, Plus,
  Clock, Car, ChevronDown, ChevronRight, DoorOpen, AlertTriangle, Bell, BellRing,
  type LucideIcon,
} from "lucide-react-native";
import { useBooth } from "@/lib/booth";
import {
  getTodayVisits, formatDate, authorizeVisit, denyVisit, giveAccess, leaveVisit,
  reportIncident, notifyHouseResident, notifyHouseResidentUrgent,
  type VisitItem,
} from "@/lib/data";
import { colors, radius, spacing, useIsTablet, VISIT_STATUS, VISIT_KIND } from "@/lib/theme";

// Opciones de los filtros (espejo del enum de `visits`).
const KIND_FILTERS = ["visitor", "service", "employee", "resident", "provider", "event"] as const;
const STATUS_FILTERS = ["pending", "authorized", "inside", "finished", "denied"] as const;

type ReportMode = "incident" | "notify" | "urgent";

// Pantalla 1 — Visitas del día. Header naranja a todo lo ancho con buscador,
// filtros pill y accesos rápidos (QR Auto / QR Caminando / hamburguesa /
// historial). Lista light-mode con cards y FAB "+" flotante.
export default function VisitasScreen() {
  const { booth } = useBooth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isTablet = useIsTablet();

  const [search, setSearch] = React.useState("");
  const [kind, setKind] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [visits, setVisits] = React.useState<VisitItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [actingId, setActingId] = React.useState<string | null>(null);

  // Modal "Reportar visita" — guarda la visita objetivo y el modo elegido.
  const [reportTarget, setReportTarget] = React.useState<VisitItem | null>(null);
  const [reportMode, setReportMode] = React.useState<ReportMode | null>(null);
  const [reportText, setReportText] = React.useState("");
  const [reportBusy, setReportBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const data = await getTodayVisits(search, kind ?? undefined, status ?? undefined);
    setVisits(data);
    setLoading(false);
    setRefreshing(false);
  }, [search, kind, status]);

  React.useEffect(() => { load(); }, [load]);

  // Ejecuta una acción de fila y refresca el listado al terminar.
  async function runAction(id: string, fn: () => Promise<{ error?: string }>) {
    setActingId(id);
    const res = await fn();
    setActingId(null);
    if (res.error) {
      Alert.alert("No se pudo completar", res.error);
      return;
    }
    startTransition(() => { load(); });
  }

  // QR Auto = vehicular, QR Caminando = peatonal. La pantalla /qr abre la
  // cámara real (expo-camera) y permite captura manual como fallback.
  function openQr(modo: "auto" | "walking") {
    router.push(`/(app)/qr?modo=${modo}`);
  }

  // Abre el modal de "Reportar visita" para una fila concreta.
  function openReport(item: VisitItem) {
    setReportTarget(item);
    setReportMode(null);
    setReportText("");
  }

  function chooseReportMode(mode: ReportMode) {
    if (!reportTarget) return;
    setReportMode(mode);
    if (mode === "incident") setReportText("");
    else if (mode === "notify") setReportText(`El visitante ${reportTarget.who} está en la caseta`);
    else setReportText(`Se requiere tu atención: visita de ${reportTarget.who}`);
  }

  function closeReport() {
    setReportTarget(null);
    setReportMode(null);
    setReportText("");
  }

  async function submitReport() {
    if (!reportTarget || !reportMode) return;
    const text = reportText.trim();
    if (reportMode === "incident" && !text) {
      Alert.alert("Falta el motivo", "Escribe el motivo de la incidencia.");
      return;
    }
    setReportBusy(true);
    let result: { error?: string };
    let okMsg = "";
    if (reportMode === "incident") {
      result = await reportIncident(reportTarget.id, text);
      okMsg = "Incidencia reportada";
    } else if (reportMode === "notify") {
      result = await notifyHouseResident(reportTarget.id, text || undefined);
      okMsg = "Aviso enviado al colono";
    } else {
      result = await notifyHouseResidentUrgent(reportTarget.id, text || undefined);
      okMsg = "Alerta enviada al responsable";
    }
    setReportBusy(false);
    if (result.error) {
      Alert.alert("No se pudo completar", result.error);
      return;
    }
    closeReport();
    Alert.alert(okMsg, "Quedó registrado.");
    startTransition(() => { load(); });
  }

  return (
    <View style={styles.root}>
      {/* Header naranja brillante (la firma estética de VisitApp Guard) */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
          {/* Fila superior: logo · buscador · iconos */}
          <View style={styles.headerTop}>
            <View style={styles.brandWrap}>
              <Text style={styles.brand}>KG-Visit</Text>
              <Text style={styles.brandSub}>{booth?.name ?? "Sin caseta"}</Text>
            </View>

            <View style={[styles.searchRow, isTablet && styles.searchRowTablet]}>
              <Search color="#fff" size={18} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar por asunto o folio…"
                placeholderTextColor="rgba(255,255,255,0.7)"
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={() => load()}
              />
            </View>

            <View style={styles.headerIcons}>
              <Pressable style={styles.iconBtn} hitSlop={8} onPress={() => openQr("auto")}>
                <Car color="#fff" size={20} />
              </Pressable>
              <Pressable
                style={styles.iconBtn}
                hitSlop={8}
                onPress={() => Alert.alert("Historial", "Disponible próximamente.")}
              >
                <Clock color="#fff" size={20} />
              </Pressable>
              <Pressable style={styles.iconBtn} hitSlop={8} onPress={() => router.push("/(app)/menu")}>
                <Menu color="#fff" size={22} />
              </Pressable>
            </View>
          </View>

          {/* Fila inferior: filtros pill y CTAs QR */}
          <View style={styles.headerBottom}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              <FilterPill
                label="Tipo Visita"
                active={kind ? (VISIT_KIND[kind] ?? kind) : null}
                options={KIND_FILTERS.map((k) => ({ value: k, label: VISIT_KIND[k] ?? k }))}
                onPick={(v) => setKind((p) => (p === v ? null : v))}
              />
              <FilterPill
                label="Status"
                active={status ? (VISIT_STATUS[status]?.label ?? status) : null}
                options={STATUS_FILTERS.map((k) => ({ value: k, label: VISIT_STATUS[k]?.label ?? k }))}
                onPick={(v) => setStatus((p) => (p === v ? null : v))}
              />
              <FilterPill
                label="Caseta"
                active={booth?.name ?? null}
                options={[]}
                disabled
              />
            </ScrollView>

            <View style={styles.qrRow}>
              <Pressable style={styles.qrBtn} onPress={() => openQr("auto")}>
                <QrCode color="#fff" size={16} />
                <Text style={styles.qrText}>QR Auto</Text>
              </Pressable>
              <Pressable style={styles.qrBtn} onPress={() => openQr("walking")}>
                <ScanLine color="#fff" size={16} />
                <Text style={styles.qrText}>QR Caminando</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Encabezados de columnas estilo tabla (sutil) */}
      <View style={[styles.tableHead, isTablet && styles.tableHeadTablet]}>
        <Text style={[styles.tableHeadCell, { flex: 2 }]}>Visita</Text>
        <Text style={[styles.tableHeadCell, { flex: 1 }]}>Tipo</Text>
        <Text style={[styles.tableHeadCell, { flex: 1, textAlign: "right" }]}>Fecha / Hora</Text>
      </View>

      {/* Listado */}
      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(v) => v.id}
          numColumns={isTablet ? 2 : 1}
          // key forza el re-mount al cambiar # de columnas (FlatList lo exige).
          key={isTablet ? "grid-2" : "list-1"}
          columnWrapperStyle={isTablet ? { gap: spacing.md } : undefined}
          contentContainerStyle={[
            { padding: spacing.md, gap: spacing.md, paddingBottom: 120 },
            isTablet && { paddingHorizontal: spacing.xl, maxWidth: 1200, alignSelf: "center", width: "100%" },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              colors={[colors.brand]}
              tintColor={colors.brand}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <DoorOpen color={colors.textFaint} size={48} />
              </View>
              <Text style={styles.emptyTitle}>
                {(search || kind || status)
                  ? "Sin visitas para los filtros actuales"
                  : "Sin visitas registradas hoy"}
              </Text>
              <Text style={styles.emptyHint}>
                {(search || kind || status)
                  ? "Ajusta los filtros o limpia la búsqueda."
                  : "Toca '+' para crear una nueva visita."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <VisitRow
              item={item}
              busy={pending || actingId === item.id}
              tablet={isTablet}
              onOpen={() => router.push(`/(app)/visitas/${item.id}`)}
              onAuthorize={() => runAction(item.id, () => authorizeVisit(item.id))}
              onDeny={() => runAction(item.id, () => denyVisit(item.id))}
              onAccess={() => runAction(item.id, () => giveAccess(item.id))}
              onLeave={() => runAction(item.id, () => leaveVisit(item.id))}
              onReport={() => openReport(item)}
            />
          )}
        />
      )}

      {/* FAB flotante naranja — Nueva visita */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={() => router.push("/(app)/nueva-visita")}
        accessibilityLabel="Nueva visita"
      >
        <Plus color="#fff" size={28} />
      </Pressable>

      {/* Modal "Reportar visita" — paso 1: 3 opciones; paso 2: formulario */}
      <Modal
        visible={!!reportTarget}
        transparent
        animationType="fade"
        onRequestClose={closeReport}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeReport}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {reportTarget && reportMode === null && (
              <>
                <Text style={styles.modalTitle}>Reportar visita</Text>
                <Text style={styles.modalHint}>
                  {reportTarget.subject || reportTarget.who} · Folio {reportTarget.folio ?? "—"}
                </Text>
                <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
                  <ReportOption
                    icon={AlertTriangle}
                    title="Reportar incidencia"
                    hint="Registrar un motivo de incidente formal"
                    tone="red"
                    onPress={() => chooseReportMode("incident")}
                  />
                  <ReportOption
                    icon={Bell}
                    title="Anunciar al colono"
                    hint="Avisar al residente que la visita llegó"
                    tone="brand"
                    onPress={() => chooseReportMode("notify")}
                  />
                  <ReportOption
                    icon={BellRing}
                    title="Avisar al responsable"
                    hint="Notificación urgente — requiere atención"
                    tone="amber"
                    onPress={() => chooseReportMode("urgent")}
                  />
                </View>
                <View style={[styles.modalActions, { marginTop: spacing.md }]}>
                  <Pressable style={styles.modalBtnGhost} onPress={closeReport}>
                    <Text style={{ color: colors.text, fontWeight: "700" }}>Cerrar</Text>
                  </Pressable>
                </View>
              </>
            )}
            {reportTarget && reportMode !== null && (
              <>
                <Text style={styles.modalTitle}>
                  {reportMode === "incident" ? "Reportar incidencia"
                    : reportMode === "notify" ? "Anunciar al colono"
                    : "Avisar al responsable"}
                </Text>
                <Text style={styles.modalHint}>
                  {reportMode === "incident"
                    ? "Describe el motivo del incidente."
                    : reportMode === "notify"
                    ? "Mensaje que verá el residente."
                    : "Mensaje urgente para el residente."}
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={reportText}
                  onChangeText={setReportText}
                  placeholder={reportMode === "incident" ? "Ej. Placa no coincide" : "Mensaje"}
                  placeholderTextColor={colors.textFaint}
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.modalActions}>
                  <Pressable style={styles.modalBtnGhost} onPress={() => { setReportMode(null); setReportText(""); }}>
                    <Text style={{ color: colors.text, fontWeight: "700" }}>Atrás</Text>
                  </Pressable>
                  <Pressable style={styles.modalBtnPrimary} onPress={submitReport} disabled={reportBusy}>
                    {reportBusy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "800" }}>Guardar</Text>}
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

// Filtro pill estilo VisitApp: outline blanco sobre header naranja, con flechita.
// Al pulsar abre un menú simple (Alert.actionSheet-style) usando Alert nativo.
function FilterPill({
  label, active, options, onPick, disabled,
}: {
  label: string;
  active: string | null;
  options: { value: string; label: string }[];
  onPick?: (v: string) => void;
  disabled?: boolean;
}) {
  function open() {
    if (disabled || !onPick || options.length === 0) return;
    Alert.alert(label, "Selecciona una opción", [
      { text: "Limpiar", style: "destructive", onPress: () => onPick("") },
      ...options.map((o) => ({ text: o.label, onPress: () => onPick(o.value) })),
      { text: "Cerrar", style: "cancel" },
    ]);
  }
  return (
    <Pressable
      style={[styles.pill, active && styles.pillActive, disabled && { opacity: 0.6 }]}
      onPress={open}
      disabled={disabled}
    >
      <Text style={styles.pillText}>{active ?? label}</Text>
      <ChevronDown color="#fff" size={14} />
    </Pressable>
  );
}

function VisitRow({
  item, busy, tablet, onOpen, onAuthorize, onDeny, onAccess, onLeave, onReport,
}: {
  item: VisitItem;
  busy: boolean;
  tablet: boolean;
  onOpen: () => void;
  onAuthorize: () => void;
  onDeny: () => void;
  onAccess: () => void;
  onLeave: () => void;
  onReport: () => void;
}) {
  const st = VISIT_STATUS[item.status] ?? { label: item.status, color: colors.textMuted };
  const kindLabel = VISIT_KIND[item.kind] ?? item.kind;
  return (
    <Pressable style={({ pressed }) => [styles.card, tablet && { flex: 1 }, pressed && styles.cardPressed]} onPress={onOpen}>
      <View style={styles.cardTop}>
        <Text style={styles.subject} numberOfLines={1}>{item.subject || item.who}</Text>
        <View style={[styles.badge, { backgroundColor: st.color + "1a" }]}>
          <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>
      <Text style={styles.meta}>{item.who} · {kindLabel} · Folio {item.folio ?? "—"}</Text>
      <Text style={styles.metaFaint}>{item.houseAddress ?? "Sin domicilio"}{item.plate ? ` · Placa ${item.plate}` : ""}</Text>
      <Text style={styles.metaFaint}>Llegada: {formatDate(item.arriveDate)}</Text>

      {/* Acciones según estatus. Cada botón detiene la propagación para no abrir el detalle. */}
      <View style={styles.actions}>
        {item.status === "pending" && (
          <>
            <ActionBtn icon={Check} label="Autorizar" tone="green" busy={busy} onPress={onAuthorize} />
            <ActionBtn icon={X} label="Denegar" tone="red" busy={busy} onPress={onDeny} />
          </>
        )}
        {item.status === "authorized" && (
          <ActionBtn icon={LogIn} label="Dar acceso" tone="brand" busy={busy} onPress={onAccess} />
        )}
        {item.status === "inside" && (
          <ActionBtn icon={LogOut} label="Salida" tone="ink" busy={busy} onPress={onLeave} />
        )}
        <ActionBtn icon={Flag} label="Reportar" tone="muted" busy={busy} onPress={onReport} />
      </View>
    </Pressable>
  );
}

type Tone = "green" | "red" | "brand" | "ink" | "muted";
const TONE: Record<Tone, string> = {
  green: colors.green, red: colors.red, brand: colors.brand, ink: colors.ink800, muted: colors.textMuted,
};

function ActionBtn({
  icon: Icon, label, tone, busy, onPress,
}: {
  icon: LucideIcon;
  label: string;
  tone: Tone;
  busy: boolean;
  onPress: () => void;
}) {
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
      <Icon color={outline ? color : "#fff"} size={15} />
      <Text style={[styles.actionText, { color: outline ? color : "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

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

  // Header naranja brillante
  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerInner: { gap: spacing.md },
  headerInnerTablet: { maxWidth: 1200, width: "100%", alignSelf: "center" },
  headerTop: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
  },
  brandWrap: { minWidth: 120 },
  brand: { color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: 0.3 },
  brandSub: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2, fontWeight: "600" },

  searchRow: {
    flex: 1,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.headerOverlay,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    minHeight: 40,
  },
  searchRowTablet: { paddingHorizontal: spacing.lg, paddingVertical: 10 },
  searchInput: { flex: 1, color: "#fff", fontSize: 14, paddingVertical: 0 },

  headerIcons: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  iconBtn: {
    width: 38, height: 38, borderRadius: radius.pill,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.headerOverlay,
  },

  headerBottom: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    gap: spacing.md, flexWrap: "wrap",
  },
  filterRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center", paddingRight: spacing.md },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 7,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.6)",
    backgroundColor: "transparent",
  },
  pillActive: { backgroundColor: colors.headerOverlayStrong, borderColor: "#fff" },
  pillText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  qrRow: { flexDirection: "row", gap: spacing.sm },
  qrBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8,
    borderWidth: 1, borderColor: "#fff",
    backgroundColor: "transparent",
  },
  qrText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Cabecera de tabla
  tableHead: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  tableHeadTablet: { maxWidth: 1200, width: "100%", alignSelf: "center", paddingHorizontal: spacing.xl },
  tableHeadCell: {
    fontSize: 11, fontWeight: "700", color: colors.textFaint,
    textTransform: "uppercase", letterSpacing: 0.6,
  },

  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl, paddingHorizontal: spacing.xl },
  emptyWrap: {
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl * 2, gap: spacing.sm,
  },
  emptyIcon: {
    width: 104, height: 104, borderRadius: radius.pill,
    backgroundColor: "#eef2f6",
    alignItems: "center", justifyContent: "center", marginBottom: spacing.md,
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "800", textAlign: "center" },
  emptyHint: { color: colors.textMuted, fontSize: 14, textAlign: "center", marginTop: 2 },

  // Cards
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardPressed: { backgroundColor: "#f1f5f9" },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  subject: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.text },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 8, fontWeight: "500" },
  metaFaint: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  action: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8,
  },
  actionText: { fontSize: 13, fontWeight: "700" },

  // Modal
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

  // FAB
  fab: {
    position: "absolute",
    right: spacing.xl,
    width: 64, height: 64, borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: "center", justifyContent: "center",
    shadowColor: colors.brand,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
