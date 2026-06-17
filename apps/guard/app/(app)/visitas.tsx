import * as React from "react";
import {
  View, Text, TextInput, FlatList, Pressable, StyleSheet, RefreshControl,
  ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, QrCode, ScanLine, Menu, Check, X, LogIn, LogOut, Flag, type LucideIcon } from "lucide-react-native";
import { useBooth } from "@/lib/booth";
import {
  getTodayVisits, formatDate, authorizeVisit, denyVisit, giveAccess, leaveVisit, reportVisit,
  type VisitItem,
} from "@/lib/data";
import { colors, radius, spacing, VISIT_STATUS, VISIT_KIND } from "@/lib/theme";

// Opciones de los filtros (espejo del enum de `visits`).
const KIND_FILTERS = ["visitor", "service", "employee", "resident", "provider", "event"] as const;
const STATUS_FILTERS = ["pending", "authorized", "inside", "finished", "denied"] as const;

export default function VisitasScreen() {
  const { booth } = useBooth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [search, setSearch] = React.useState("");
  const [kind, setKind] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [visits, setVisits] = React.useState<VisitItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [actingId, setActingId] = React.useState<string | null>(null);

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

  function qrStub(modo: string) {
    Alert.alert("Escaneo por cámara", `${modo} se habilita desde la cámara del dispositivo (próximamente).`);
  }

  return (
    <View style={styles.root}>
      {/* Barra superior oscura */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.brand}>KG-<Text style={{ color: colors.brand }}>Visit</Text></Text>
            <Text style={styles.headerSub}>Control de accesos · {booth?.name ?? "Sin caseta"}</Text>
          </View>
          <Pressable hitSlop={8} onPress={() => router.push("/(app)/menu")}>
            <Menu color="#fff" size={24} />
          </Pressable>
        </View>

        {/* Buscador */}
        <View style={styles.searchRow}>
          <Search color={colors.textFaint} size={18} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por asunto o folio…"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => load()}
          />
        </View>

        {/* Botones QR (stubs) */}
        <View style={styles.qrRow}>
          <Pressable style={styles.qrBtn} onPress={() => qrStub("QR Auto")}>
            <QrCode color="#fff" size={16} />
            <Text style={styles.qrText}>QR Auto</Text>
          </Pressable>
          <Pressable style={styles.qrBtn} onPress={() => qrStub("QR Caminando")}>
            <ScanLine color="#fff" size={16} />
            <Text style={styles.qrText}>QR Caminando</Text>
          </Pressable>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <FilterGroup label="Tipo" active={kind} options={KIND_FILTERS} labels={VISIT_KIND}
            onPick={(v) => setKind((p) => (p === v ? null : v))} />
          <FilterGroup label="Status" active={status} options={STATUS_FILTERS}
            labels={Object.fromEntries(Object.entries(VISIT_STATUS).map(([k, v]) => [k, v.label]))}
            onPick={(v) => setStatus((p) => (p === v ? null : v))} />
        </ScrollView>
      </View>

      {/* Listado */}
      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<Text style={styles.empty}>No hay visitas para los filtros actuales.</Text>}
          renderItem={({ item }) => (
            <VisitRow
              item={item}
              busy={pending || actingId === item.id}
              onAuthorize={() => runAction(item.id, () => authorizeVisit(item.id))}
              onDeny={() => runAction(item.id, () => denyVisit(item.id))}
              onAccess={() => runAction(item.id, () => giveAccess(item.id))}
              onLeave={() => runAction(item.id, () => leaveVisit(item.id))}
              onReport={() => runAction(item.id, () => reportVisit(item.id))}
            />
          )}
        />
      )}
    </View>
  );
}

function FilterGroup({
  label, active, options, labels, onPick,
}: {
  label: string;
  active: string | null;
  options: readonly string[];
  labels: Record<string, string>;
  onPick: (v: string) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      {options.map((opt) => {
        const on = active === opt;
        return (
          <Pressable key={opt} style={[styles.chip, on && styles.chipOn]} onPress={() => onPick(opt)}>
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{labels[opt] ?? opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function VisitRow({
  item, busy, onAuthorize, onDeny, onAccess, onLeave, onReport,
}: {
  item: VisitItem;
  busy: boolean;
  onAuthorize: () => void;
  onDeny: () => void;
  onAccess: () => void;
  onLeave: () => void;
  onReport: () => void;
}) {
  const st = VISIT_STATUS[item.status] ?? { label: item.status, color: colors.textMuted };
  const kindLabel = VISIT_KIND[item.kind] ?? item.kind;
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.subject} numberOfLines={1}>{item.subject || item.who}</Text>
        <View style={[styles.badge, { backgroundColor: st.color + "22" }]}>
          <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>
      <Text style={styles.meta}>{item.who} · {kindLabel} · Folio {item.folio ?? "—"}</Text>
      <Text style={styles.metaFaint}>{item.houseAddress ?? "Sin domicilio"}{item.plate ? ` · Placa ${item.plate}` : ""}</Text>
      <Text style={styles.metaFaint}>Llegada: {formatDate(item.arriveDate)}</Text>

      {/* Acciones según estatus */}
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
    </View>
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
      style={[styles.action, outline ? { borderColor: color, borderWidth: 1 } : { backgroundColor: color }]}
      onPress={onPress}
      disabled={busy}
    >
      <Icon color={outline ? color : "#fff"} size={15} />
      <Text style={[styles.actionText, { color: outline ? color : "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.ink, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.ink800, borderRadius: radius.md, paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  searchInput: { flex: 1, color: "#fff", paddingVertical: spacing.sm, fontSize: 14 },
  qrRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  qrBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: colors.ink800, borderRadius: radius.md, paddingVertical: spacing.sm,
  },
  qrText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  filters: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.md, alignItems: "center" },
  group: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  groupLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, marginRight: 2 },
  chip: { backgroundColor: colors.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  chipTextOn: { color: "#fff" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl, paddingHorizontal: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  subject: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
  metaFaint: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  action: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  actionText: { fontSize: 13, fontWeight: "700" },
});
