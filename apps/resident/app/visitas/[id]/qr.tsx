import * as React from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Share, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Share2 } from "lucide-react-native";
import Svg, { Rect, G } from "react-native-svg";
import { getVisitDetail, formatDate, type VisitDetail } from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

// Marco decorativo estilo QR. Generamos un patrón pseudo-aleatorio a partir del
// folio (hash determinista) para que cada visita tenga su propio "stamp" visual.
// No es un QR real — explícitamente es un pase visual con folio en grande.
function hashFolio(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function StampGrid({ folio }: { folio: string }) {
  const size = 220;
  const cells = 12;
  const cell = size / cells;
  const seed = hashFolio(folio);
  // Determinismo: cada celda se llena si el bit correspondiente del hash es 1.
  // Repetimos el hash para llenar todas las celdas.
  const filled: boolean[] = [];
  let acc = seed || 1;
  for (let i = 0; i < cells * cells; i++) {
    acc = (acc * 1103515245 + 12345) & 0x7fffffff;
    filled.push((acc & 1) === 1);
  }
  return (
    <Svg width={size} height={size}>
      {/* Marco */}
      <Rect x={0} y={0} width={size} height={size} fill="#fff" />
      {/* Esquinas estilo QR */}
      <Corner x={6} y={6} cell={cell} />
      <Corner x={size - cell * 3 - 6} y={6} cell={cell} />
      <Corner x={6} y={size - cell * 3 - 6} cell={cell} />
      <G>
        {filled.map((f, i) => {
          if (!f) return null;
          const r = Math.floor(i / cells);
          const c = i % cells;
          // No pintamos sobre las esquinas (4x4 de cada una).
          const inTopLeft = r < 4 && c < 4;
          const inTopRight = r < 4 && c >= cells - 4;
          const inBottomLeft = r >= cells - 4 && c < 4;
          if (inTopLeft || inTopRight || inBottomLeft) return null;
          return (
            <Rect
              key={i}
              x={c * cell}
              y={r * cell}
              width={cell - 1}
              height={cell - 1}
              fill={colors.bg}
            />
          );
        })}
      </G>
    </Svg>
  );
}

function Corner({ x, y, cell }: { x: number; y: number; cell: number }) {
  const s = cell * 3;
  return (
    <G>
      <Rect x={x} y={y} width={s} height={s} fill={colors.bg} />
      <Rect x={x + cell * 0.5} y={y + cell * 0.5} width={s - cell} height={s - cell} fill="#fff" />
      <Rect x={x + cell} y={y + cell} width={cell} height={cell} fill={colors.bg} />
    </G>
  );
}

export default function QrScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [visit, setVisit] = React.useState<VisitDetail | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    getVisitDetail(id).then((v) => {
      setVisit(v);
      setLoading(false);
    });
  }, [id]);

  async function share() {
    if (!visit) return;
    try {
      await Share.share({
        message:
          `Pase KG-Visit\nFolio: ${visit.folio ?? "—"}\n` +
          `Asunto: ${visit.subject ?? "—"}\n` +
          `Llegada: ${formatDate(visit.arriveDate)}`,
      });
    } catch (e: unknown) {
      Alert.alert("No se pudo compartir", e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft color={colors.text} size={26} />
        </Pressable>
        <Text style={styles.title}>Pase de visita</Text>
      </View>

      {loading || !visit ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, alignItems: "center", paddingBottom: spacing.xl * 2 }}>
          <Text style={styles.subject} numberOfLines={2}>{visit.subject ?? visit.visitorName ?? "Visita"}</Text>

          {/* Tarjeta de pase con glow naranja */}
          <View style={styles.passOuter}>
            <View style={styles.passInner}>
              <View style={styles.qrFrame}>
                <StampGrid folio={visit.folio ?? visit.id} />
              </View>

              <Text style={styles.folioLabel}>FOLIO</Text>
              <Text style={styles.folio}>{visit.folio ?? "—"}</Text>
              <Text style={styles.hint}>Muestra este folio al guardia en caseta.</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.shareBtn, pressed && { transform: [{ scale: 0.98 }] }]}
            onPress={share}
          >
            <Share2 color="#fff" size={18} />
            <Text style={styles.shareText}>Compartir</Text>
          </Pressable>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>Volver al detalle</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  subject: { fontSize: 18, fontWeight: "700", color: colors.text, textAlign: "center" },
  // Glow exterior naranja muy suave
  passOuter: {
    padding: 4,
    borderRadius: radius.xl + 4,
    backgroundColor: colors.brandSoft,
    shadowColor: colors.brand,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  passInner: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.brand + "55",
  },
  qrFrame: {
    padding: spacing.md, backgroundColor: "#fff", borderRadius: radius.lg,
  },
  folioLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 2, marginTop: spacing.lg },
  folio: { fontSize: 40, fontWeight: "900", color: colors.brand, letterSpacing: 3, marginTop: 4 },
  hint: { color: colors.textMuted, fontSize: 13, textAlign: "center", paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  shareBtn: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.brand, paddingVertical: spacing.md + 2, paddingHorizontal: spacing.xl + 8,
    borderRadius: radius.pill,
    shadowColor: colors.brand, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  shareText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  backBtn: { paddingVertical: spacing.md },
  backText: { color: colors.textMuted, fontWeight: "600" },
});
