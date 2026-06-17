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
import { colors, radius, spacing, VISIT_STATUS, VISIT_KIND } from "@/lib/theme";

// Pantalla 13 — QR Auto / Caminando. Como `expo-camera` puede dar problemas en
// MuMu y aún no es objetivo de esta fase, usamos captura MANUAL del folio
// (etiquetado honestamente). La búsqueda llama getVisitByFolio y permite
// dar acceso / registrar salida desde la misma pantalla.
export default function QrScreen() {
  const { modo } = useLocalSearchParams<{ modo?: "auto" | "walking" | string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { booth } = useBooth();

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
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.back}><ChevronLeft color="#fff" size={26} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>{isWalking ? "QR Caminando" : "QR Auto"}</Text>
          <Text style={styles.brandHint}>{isWalking ? "Acceso peatonal" : "Acceso vehicular"} · {booth?.name ?? "Sin caseta"}</Text>
        </View>
        {isWalking ? <ScanLine color="#fff" size={22} /> : <QrCode color="#fff" size={22} />}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Captura manual de folio</Text>
          <Text style={styles.cardHint}>Escaneo por cámara — próximamente. Por ahora ingresa el folio del pase.</Text>
          <View style={styles.row}>
            <TextInput style={styles.input} value={folio} onChangeText={setFolio}
              placeholder="Folio del pase" placeholderTextColor={colors.textFaint}
              keyboardType="default" autoCapitalize="characters" returnKeyType="search"
              onSubmitEditing={search} />
            <Pressable style={styles.searchBtn} onPress={search} disabled={searching}>
              {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchBtnText}>Buscar</Text>}
            </Pressable>
          </View>
        </View>

        {notFound && (
          <View style={[styles.card, { borderColor: colors.red, borderWidth: 1 }]}>
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
                <View style={[styles.badge, { backgroundColor: st.color + "22" }]}>
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
                <Pressable style={[styles.actionBtn, { borderWidth: 1, borderColor: colors.textMuted }]} disabled={acting}
                  onPress={() => run(() => reportVisit(visit.id), "Visita reportada.")}>
                  <Flag color={colors.textMuted} size={16} />
                  <Text style={[styles.actionText, { color: colors.textMuted }]}>Reportar</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }]}
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
  header: {
    backgroundColor: colors.ink, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
  },
  back: { padding: 4 },
  brand: { color: "#fff", fontSize: 20, fontWeight: "800" },
  brandHint: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 14, fontWeight: "800", color: colors.text },
  cardHint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  row: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  input: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15,
    color: colors.text, backgroundColor: colors.bg,
  },
  searchBtn: {
    backgroundColor: colors.brand, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.md, alignItems: "center", justifyContent: "center", minWidth: 90,
  },
  searchBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  visitTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  subject: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.text },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 8 },
  metaFaint: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
  },
  actionText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
