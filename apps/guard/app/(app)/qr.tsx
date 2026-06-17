import * as React from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft, QrCode, ScanLine, LogIn, LogOut, Flag, Keyboard, Camera as CameraIcon,
} from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useBooth } from "@/lib/booth";
import {
  getVisitByFolio, giveAccess, leaveVisit, reportVisit, formatDate, type VisitItem,
} from "@/lib/data";
import { colors, radius, spacing, useIsTablet, VISIT_STATUS, VISIT_KIND } from "@/lib/theme";

// Pantalla 13 — QR Auto / Caminando. Usa la cámara real (expo-camera CameraView)
// con el barcode scanner activado para QR. Si el guardia prefiere capturar el
// folio a mano, hay un fallback "Captura manual" al final.
export default function QrScreen() {
  const { modo } = useLocalSearchParams<{ modo?: "auto" | "walking" | string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { booth } = useBooth();
  const isTablet = useIsTablet();

  const isWalking = modo === "walking";

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = React.useState(false);
  const [manual, setManual] = React.useState(false);

  const [folio, setFolio] = React.useState("");
  const [visit, setVisit] = React.useState<VisitItem | null>(null);
  const [searching, setSearching] = React.useState(false);
  const [acting, setActing] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);

  // Pide permiso al montar.
  React.useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  // Convierte el contenido escaneado en un folio. Acepta texto plano (F-XXXX)
  // o un JSON con { folio: "F-XXXX" }.
  function extractFolio(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed) as { folio?: unknown };
        if (typeof parsed.folio === "string" && parsed.folio.length > 0) return parsed.folio.trim();
      } catch {
        // No es JSON válido: lo tratamos como texto plano abajo.
      }
    }
    return trimmed;
  }

  async function handleBarcode(raw: string) {
    if (scanned || searching) return;
    setScanned(true);
    const extracted = extractFolio(raw);
    if (!extracted) {
      setScanned(false);
      return;
    }
    await lookupFolio(extracted);
  }

  async function lookupFolio(f: string) {
    setSearching(true);
    setNotFound(false);
    const v = await getVisitByFolio(f);
    setSearching(false);
    if (!v) {
      setVisit(null);
      setNotFound(true);
      Alert.alert("Folio no válido o expirado", `No se encontró ninguna visita con folio "${f}".`, [
        { text: "OK", onPress: () => setScanned(false) },
      ]);
      return;
    }
    setVisit(v);
  }

  async function searchManual() {
    const f = folio.trim();
    if (!f) return;
    await lookupFolio(f);
  }

  async function run(fn: () => Promise<{ error?: string }>, ok: string) {
    setActing(true);
    const res = await fn();
    setActing(false);
    if (res.error) { Alert.alert("No se pudo completar", res.error); return; }
    Alert.alert("Listo", ok, [{ text: "OK", onPress: () => router.replace("/(app)/visitas") }]);
  }

  function resetForNextScan() {
    setVisit(null);
    setNotFound(false);
    setFolio("");
    setScanned(false);
  }

  return (
    <View style={styles.root}>
      {/* Header naranja con icono grande del modo */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color="#fff" size={24} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>{isWalking ? "QR Caminando" : "QR Auto"}</Text>
            <Text style={styles.brandHint}>
              {isWalking ? "Acceso peatonal" : "Acceso vehicular"} · {booth?.name ?? "Sin caseta"}
            </Text>
          </View>
          <View style={styles.headerIcon}>
            {isWalking ? <ScanLine color="#fff" size={26} /> : <QrCode color="#fff" size={26} />}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={[
        { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
        isTablet && { padding: spacing.xl, maxWidth: 720, alignSelf: "center", width: "100%" },
      ]}>
        {/* Visor cámara — sólo si no hay visita resuelta y no estamos en modo manual */}
        {!visit && !manual && (
          <View style={styles.cameraWrap}>
            {permission?.granted ? (
              <>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  onBarcodeScanned={scanned ? undefined : (r) => handleBarcode(r.data)}
                />
                {/* Overlay: cuadrado con esquinas naranja brand */}
                <View pointerEvents="none" style={styles.cameraOverlay}>
                  <View style={styles.scanFrame}>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                  </View>
                  <Text style={styles.scanHint}>Apunta al QR del visitante</Text>
                </View>
                {searching && (
                  <View style={styles.searchingOverlay}>
                    <ActivityIndicator color="#fff" size="large" />
                    <Text style={styles.searchingText}>Buscando folio…</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noCam}>
                <CameraIcon color="#fff" size={48} />
                <Text style={styles.noCamTitle}>Cámara no disponible</Text>
                <Text style={styles.noCamHint}>
                  Otorga permiso de cámara para escanear o usa la captura manual.
                </Text>
                <Pressable style={styles.noCamBtn} onPress={() => requestPermission()}>
                  <Text style={{ color: "#fff", fontWeight: "800" }}>Solicitar permiso</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Captura manual (fallback) */}
        {!visit && manual && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Captura manual de folio</Text>
            <Text style={styles.cardHint}>Ingresa el folio del pase tal como aparece en la app del residente.</Text>
            <TextInput style={styles.input} value={folio} onChangeText={setFolio}
              placeholder="FOLIO" placeholderTextColor={colors.textFaint}
              keyboardType="default" autoCapitalize="characters" returnKeyType="search"
              onSubmitEditing={searchManual} />
            <Pressable style={styles.searchBtn} onPress={searchManual} disabled={searching}>
              {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchBtnText}>Buscar</Text>}
            </Pressable>
            <Pressable style={styles.linkBtn} onPress={() => setManual(false)}>
              <Text style={styles.linkBtnText}>Volver al escáner</Text>
            </Pressable>
          </View>
        )}

        {!visit && !manual && (
          <Pressable style={styles.manualBtn} onPress={() => setManual(true)}>
            <Keyboard color={colors.brand} size={18} />
            <Text style={styles.manualBtnText}>Captura manual</Text>
          </Pressable>
        )}

        {notFound && !visit && (
          <View style={[styles.card, styles.cardError]}>
            <Text style={[styles.cardTitle, { color: colors.red }]}>Folio no encontrado</Text>
            <Text style={styles.cardHint}>Verifica que el folio corresponda a una visita del tenant.</Text>
          </View>
        )}

        {visit && (() => {
          const st = VISIT_STATUS[visit.status] ?? { label: visit.status, color: colors.textMuted };
          const kindLabel = VISIT_KIND[visit.kind] ?? visit.kind;
          return (
            <View style={styles.card}>
              <View style={styles.visitTop}>
                <Text style={styles.subject} numberOfLines={1}>{visit.subject || visit.who}</Text>
                <View style={[styles.badge, { backgroundColor: st.color + "1a" }]}>
                  <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>
              <Text style={styles.meta}>{visit.who} · {kindLabel} · Folio {visit.folio ?? "—"}</Text>
              <Text style={styles.metaFaint}>{visit.houseAddress ?? "Sin domicilio"}{visit.plate ? ` · Placa ${visit.plate}` : ""}</Text>
              <Text style={styles.metaFaint}>Llegada: {formatDate(visit.arriveDate)}</Text>

              <View style={styles.actions}>
                {(visit.status === "authorized" || visit.status === "pending") && (
                  <Pressable style={[styles.actionBtn, { backgroundColor: colors.brand }]} disabled={acting}
                    onPress={() => run(() => giveAccess(visit.id), "Acceso registrado.")}>
                    <LogIn color="#fff" size={16} /><Text style={styles.actionText}>Dar acceso</Text>
                  </Pressable>
                )}
                {visit.status === "inside" && (
                  <Pressable style={[styles.actionBtn, { backgroundColor: colors.ink800 }]} disabled={acting}
                    onPress={() => run(() => leaveVisit(visit.id), "Salida registrada.")}>
                    <LogOut color="#fff" size={16} /><Text style={styles.actionText}>Registrar salida</Text>
                  </Pressable>
                )}
                <Pressable style={[styles.actionBtn, styles.actionGhost]} disabled={acting}
                  onPress={() => run(() => reportVisit(visit.id), "Visita reportada.")}>
                  <Flag color={colors.textMuted} size={16} />
                  <Text style={[styles.actionText, { color: colors.textMuted }]}>Reportar</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, styles.actionGhost]}
                  onPress={() => router.push(`/(app)/visitas/${visit.id}`)}>
                  <Text style={[styles.actionText, { color: colors.text }]}>Ver detalle</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, styles.actionGhost]} onPress={resetForNextScan}>
                  <Text style={[styles.actionText, { color: colors.brand }]}>Escanear otro</Text>
                </Pressable>
              </View>
            </View>
          );
        })()}
      </ScrollView>
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
  brandHint: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2, fontWeight: "600" },
  headerIcon: {
    width: 44, height: 44, borderRadius: radius.pill,
    backgroundColor: colors.headerOverlayStrong, borderWidth: 1, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },

  // Visor cámara
  cameraWrap: {
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  scanFrame: {
    width: "65%",
    aspectRatio: 1,
    borderRadius: radius.lg,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 36, height: 36,
    borderColor: colors.brand,
  },
  cornerTL: { top: 0, left: 0, borderLeftWidth: 4, borderTopWidth: 4, borderTopLeftRadius: radius.md },
  cornerTR: { top: 0, right: 0, borderRightWidth: 4, borderTopWidth: 4, borderTopRightRadius: radius.md },
  cornerBL: { bottom: 0, left: 0, borderLeftWidth: 4, borderBottomWidth: 4, borderBottomLeftRadius: radius.md },
  cornerBR: { bottom: 0, right: 0, borderRightWidth: 4, borderBottomWidth: 4, borderBottomRightRadius: radius.md },
  scanHint: {
    color: "#fff", fontSize: 14, fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  searchingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center", gap: spacing.sm,
  },
  searchingText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  noCam: {
    flex: 1, alignItems: "center", justifyContent: "center",
    gap: spacing.sm, padding: spacing.xl, backgroundColor: "#1f2937",
  },
  noCamTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  noCamHint: { color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center" },
  noCamBtn: {
    marginTop: spacing.sm, backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
  },

  manualBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#fff", borderWidth: 1, borderColor: colors.brand,
    borderRadius: radius.pill, paddingVertical: spacing.md,
  },
  manualBtnText: { color: colors.brand, fontWeight: "800", fontSize: 14 },
  linkBtn: { alignItems: "center", paddingVertical: spacing.sm, marginTop: 4 },
  linkBtnText: { color: colors.brand, fontWeight: "700", fontSize: 13 },

  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border, gap: spacing.md,
    shadowColor: "#0f172a", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardError: { borderColor: colors.red, borderWidth: 1.5 },
  cardTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  cardHint: { fontSize: 13, color: colors.textMuted },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, fontSize: 28,
    color: colors.text, backgroundColor: colors.bg, fontWeight: "800",
    textAlign: "center", letterSpacing: 4, marginTop: spacing.sm,
  },
  searchBtn: {
    backgroundColor: colors.brand,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill, alignItems: "center", justifyContent: "center",
    shadowColor: colors.brand, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  visitTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  subject: { flex: 1, fontSize: 16, fontWeight: "800", color: colors.text },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4, fontWeight: "500" },
  metaFaint: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9,
  },
  actionGhost: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  actionText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
