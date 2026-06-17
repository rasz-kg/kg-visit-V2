import * as React from "react";
import {
  View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ShieldAlert } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { getMyPanicAlerts, formatDate, type PanicAlertItem } from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

const KIND_LABEL: Record<string, string> = {
  resident: "Pánico",
  guard: "Caseta",
  fire: "Incendio",
  medical: "Médica",
  security: "Seguridad",
};

export default function MisAlertasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [items, setItems] = React.useState<PanicAlertItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    const data = await getMyPanicAlerts(profile?.id ?? null);
    setItems(data);
    setLoading(false);
    setRefreshing(false);
  }, [profile?.id]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft color={colors.text} size={26} />
        </Pressable>
        <Text style={styles.title}>Mis alertas</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={colors.brand}
              colors={[colors.brand]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}><ShieldAlert color={colors.red} size={28} /></View>
              <Text style={styles.empty}>Sin alertas todavía</Text>
              <Text style={styles.emptyHint}>Aquí verás el historial de tus llamadas de emergencia.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const pending = item.status; // true = pendiente; false = atendida
            const badgeColor = pending ? colors.amber : colors.green;
            const badgeLabel = pending ? "Pendiente" : "Atendida";
            return (
              <View style={styles.card}>
                <View style={[styles.iconWrap, { backgroundColor: colors.red + "22" }]}>
                  <ShieldAlert color={colors.red} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.row}>
                    <Text style={styles.name}>{KIND_LABEL[item.kind ?? ""] ?? item.kind ?? "Alerta"}</Text>
                    <View style={[styles.badge, { backgroundColor: badgeColor + "22", borderColor: badgeColor + "55" }]}>
                      <View style={[styles.dot, { backgroundColor: badgeColor }]} />
                      <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
        />
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
  emptyWrap: { alignItems: "center", paddingTop: spacing.xl * 2, gap: spacing.sm },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.red + "22",
    alignItems: "center", justifyContent: "center", marginBottom: spacing.sm,
  },
  empty: { textAlign: "center", color: colors.text, fontSize: 16, fontWeight: "700" },
  emptyHint: { textAlign: "center", color: colors.textMuted, fontSize: 13, paddingHorizontal: spacing.xl },
  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, justifyContent: "space-between" },
  name: { color: colors.text, fontSize: 15, fontWeight: "700", flex: 1 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  date: { color: colors.textFaint, fontSize: 12, marginTop: 4 },
});
