import * as React from "react";
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Share, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Share2 } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { getVisitById, formatDate, type VisitDetail } from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

// Pantalla "Emitir QR" — muestra un QR REAL con el folio de la visita para que
// el visitante pueda llevarlo. Se genera con `react-native-qrcode-svg` (que
// usa react-native-svg). El payload es el folio plano; el escáner del lado
// caseta lo acepta directo o lo parsea como JSON si lo recibe envuelto.
export default function QrEmitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [visit, setVisit] = React.useState<VisitDetail | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    getVisitById(String(id)).then((v) => {
      setVisit(v);
      setLoading(false);
    });
  }, [id]);

  async function share() {
    if (!visit) return;
    try {
      await Share.share({
        message:
          `Folio KG-Visit: ${visit.folio ?? "—"}\n` +
          `Asunto: ${visit.subject ?? "—"}\n` +
          `Llegada: ${formatDate(visit.arriveDate)}`,
      });
    } catch (e: unknown) {
      Alert.alert("No se pudo compartir", e instanceof Error ? e.message : String(e));
    }
  }

  // Payload del QR: el folio plano (formato esperado por el scanner). Si no
  // hay folio aún, usamos el id como fallback para no romper el render.
  const qrValue = visit?.folio ?? visit?.id ?? "";

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Pase de visita</Text>
          <Text style={styles.title}>Emitir QR</Text>
        </View>
      </View>

      {loading || !visit ? (
        <ActivityIndicator color={colors.brand} size="large" style={{ marginTop: spacing.xl * 2 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg, gap: spacing.lg, alignItems: "center",
            paddingBottom: spacing.xl * 2,
          }}
        >
          <Text style={styles.subject} numberOfLines={2}>{visit.subject || visit.who}</Text>

          <View style={styles.passOuter}>
            <View style={styles.passMid}>
              <View style={styles.passInner}>
                <View style={styles.qrFrame}>
                  {qrValue ? (
                    <QRCode
                      value={qrValue}
                      size={220}
                      color={colors.ink}
                      backgroundColor="#ffffff"
                    />
                  ) : (
                    <View style={{ width: 220, height: 220, alignItems: "center", justifyContent: "center" }}>
                      <Text style={styles.faint}>Folio no disponible</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.folioLabel}>FOLIO</Text>
                <Text style={styles.folio}>{visit.folio ?? "—"}</Text>
                <Text style={styles.hint}>
                  Comparte este pase con el visitante. Al escanearlo en caseta se valida automáticamente.
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && { transform: [{ scale: 0.98 }] }]}
            onPress={share}
          >
            <Share2 color="#fff" size={18} />
            <Text style={styles.shareText}>Compartir</Text>
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={() => router.back()}>
            <Text style={styles.linkText}>Volver al detalle</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.brand, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: radius.pill,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.headerOverlay,
  },
  kicker: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 2 },
  subject: { fontSize: 18, fontWeight: "700", color: colors.text, textAlign: "center" },
  faint: { color: colors.textFaint, fontSize: 13 },

  // Marco exterior: stack de dos capas para simular gradiente naranja→ámbar.
  passOuter: {
    padding: 3,
    borderRadius: radius.xl + 6,
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  passMid: {
    padding: 2,
    borderRadius: radius.xl + 3,
    backgroundColor: colors.amber,
  },
  passInner: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.brand + "33",
  },
  qrFrame: {
    padding: spacing.md, backgroundColor: "#fff", borderRadius: radius.lg,
  },
  folioLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 2, marginTop: spacing.lg },
  folio: {
    fontSize: 44, fontWeight: "900", color: colors.brand, letterSpacing: 3, marginTop: 4,
    textShadowColor: colors.brand + "55",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
    textAlign: "center",
  },
  hint: {
    color: colors.textMuted, fontSize: 13, textAlign: "center",
    paddingHorizontal: spacing.lg, marginTop: spacing.sm,
  },
  shareBtn: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.brand,
    paddingVertical: spacing.md + 2, paddingHorizontal: spacing.xl + 8,
    borderRadius: radius.pill,
    shadowColor: colors.brand, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  shareText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  linkBtn: { paddingVertical: spacing.md },
  linkText: { color: colors.textMuted, fontWeight: "600" },
});
