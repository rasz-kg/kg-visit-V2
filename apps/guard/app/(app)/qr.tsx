import * as React from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, QrCode, ScanLine, LogIn, LogOut, Flag } from "lucide-react-native";
import { useBooth } from "@/lib/booth";
import {
  getVisitByFolio, giveAccess, leaveVisit, reportVisit, formatDate, type VisitItem,
} from "@/lib/data";
import { colors, radius, spacing, useIsTablet, VISIT_STATUS, VISIT_KIND } from "@/lib/theme";

// Pantalla 13 — QR Auto / Caminando. Como `expo-camera` puede dar problemas en
// MuMu y aún no es objetivo de esta fase, usamos captura MANUAL del folio
// (etiquetado honestamente). La búsqueda llama getVisitByFolio y permite
// dar acceso / registrar salida desde la misma pantalla.
export default function QrScreen() {
  const { modo } = useLocalSearchParams<{ modo?: "auto" | "walking" | string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { booth } = useBooth();
  const isTablet = useIsTablet();

  const isWalking = modo === "walking";

  const [folio, setFolio] = React.useState("");
  const [visit, setVisit] = React.useState<VisitItem | null>(null);
  const [searching, setSearching] = React.useState(false);
  const [acting, setActing] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);

  async function search() {
    const f = folio.trim();
    if (!f) return;
    setSearching(true);
    setNotFound(false);
    const v = await getVisitByFolio(f);
    setSearching(false);
    if (!v) { setVisit(null); setNotFound(true); return; }
    setVisit(v);
  }

  async function run(fn: () => Promise<{ error?: string }>, ok: string) {
    setActing(true);
    const res = await fn();
    setActing(false);
    if (res.error) { Alert.alert("No se pudo completar", res.error); return; }
    Alert.alert("Listo", ok, [{ text: "OK", onPress: () => router.replace("/(app)/visitas") }]);
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
            <Text style={styles.brandHint}>{isWalking ? "Acceso peatonal" : "Acceso vehicular"} · {booth?.name ?? "Sin caseta"}</Text>
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
        {/* Card gigante de captura */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Captura manual de folio</Text>
          <Text style={styles.cardHint}>Escaneo por cámara — próximamente. Por ahora ingresa el folio del pase.</Text>
          <TextInput style={styles.input} value={folio} onChangeText={setFolio}
            placeholder="FOLIO" placeholderTextColor={colors.textFaint}
            keyboardType="default" autoCapitalize="characters" returnKeyType="search"
            onSubmitEditing={search} />
          <Pressable style={styles.searchBtn} onPress={search} disabled={searching}>
            {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchBtnText}>Buscar</Text>}
          </Pressable>
        </View>

        {notFound && (
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
