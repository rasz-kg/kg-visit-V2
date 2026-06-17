import * as React from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Share } from "react-native";
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
              fill={colors.ink}
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
      <Rect x={x} y={y} width={s} height={s} fill={colors.ink} />
      <Rect x={x + cell * 0.5} y={y + cell * 0.5} width={s - cell} height={s - cell} fill="#fff" />
      <Rect x={x + cell} y={y + cell} width={cell} height={cell} fill={colors.ink} />
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
          <ChevronLeft color="#fff" size={26} />
        </Pressable>
        <Text style={styles.title}>Pase de visita</Text>
      </View>

      {loading || !visit ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <View style={{ padding: spacing.lg, gap: spacing.lg, alignItems: "center" }}>
          <Text style={styles.subject}>{visit.subject ?? visit.visitorName ?? "Visita"}</Text>

          <View style={styles.qrCard}>
            <StampGrid folio={visit.folio ?? visit.id} />
          </View>

          <Text style={styles.folioLabel}>Folio</Text>
          <Text style={styles.folio}>{visit.folio ?? "—"}</Text>
          <Text style={styles.hint}>Muestra este folio al guardia en caseta.</Text>

          <Pressable style={styles.shareBtn} onPress={share}>
            <Share2 color="#fff" size={18} />
            <Text style={styles.shareText}>Compartir</Text>
          </Pressable>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>Volver al detalle</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.ink, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  subject: { fontSize: 18, fontWeight: "700", color: colors.text },
  qrCard: {
    padding: spacing.lg, backgroundColor: "#fff", borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  folioLabel: { color: colors.textMuted, fontSize: 13, marginTop: -spacing.sm },
  folio: { fontSize: 32, fontWeight: "900", color: colors.brand, letterSpacing: 2 },
  hint: { color: colors.textMuted, fontSize: 13, textAlign: "center", paddingHorizontal: spacing.lg },
  shareBtn: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.ink, paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  shareText: { color: "#fff", fontWeight: "700" },
  backBtn: { paddingVertical: spacing.md },
  backText: { color: colors.textMuted, fontWeight: "600" },
});
