import * as React from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { getVisits, formatDate, type VisitItem } from "@/lib/data";
import { colors, radius, spacing, VISIT_STATUS } from "@/lib/theme";

export default function VisitasScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [visits, setVisits] = React.useState<VisitItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    const data = await getVisits(profile?.houseId ?? null);
    setVisits(data);
    setLoading(false);
    setRefreshing(false);
  }, [profile?.houseId]);

  // Recarga al volver del wizard de Nueva visita.
  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Visitas</Text>
        <Text style={styles.subtitle}>Las visitas registradas para tu domicilio.</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<Text style={styles.empty}>Aún no tienes visitas. Crea una nueva visita.</Text>}
          renderItem={({ item }) => {
            const st = VISIT_STATUS[item.status] ?? { label: item.status, color: colors.textMuted };
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.subject} numberOfLines={1}>{item.subject || item.who}</Text>
                  <View style={[styles.badge, { backgroundColor: st.color + "22" }]}>
                    <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>{item.who} · Folio {item.folio ?? "—"}</Text>
                <Text style={styles.metaFaint}>Llegada: {formatDate(item.arriveDate)}</Text>
              </View>
            );
          }}
        />
      )}
      <Pressable style={styles.fab} onPress={() => router.push("/nueva-visita")}>
        <Plus color="#fff" size={28} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.ink, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: colors.textFaint, fontSize: 13, marginTop: 4 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl, paddingHorizontal: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  subject: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
  metaFaint: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  fab: {
    position: "absolute", right: spacing.lg, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand,
    alignItems: "center", justifyContent: "center", elevation: 4,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
});
