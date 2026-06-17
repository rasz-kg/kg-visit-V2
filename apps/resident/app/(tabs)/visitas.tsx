import * as React from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus, DoorOpen } from "lucide-react-native";
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
        <View style={styles.accent} />
      </View>
      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 120 }}
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
              <View style={styles.emptyIcon}><DoorOpen color={colors.brand} size={28} /></View>
              <Text style={styles.empty}>Aún no tienes visitas.</Text>
              <Text style={styles.emptyHint}>Crea una nueva visita con el botón naranja.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const st = VISIT_STATUS[item.status] ?? { label: item.status, color: colors.textMuted };
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
                onPress={() => router.push(`/visitas/${item.id}`)}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.subject} numberOfLines={1}>{item.subject || item.who}</Text>
                  <View style={[styles.badge, { backgroundColor: st.color + "22" }]}>
                    <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>{item.who} · Folio {item.folio ?? "—"}</Text>
                <Text style={styles.metaFaint}>Llegada: {formatDate(item.arriveDate)}</Text>
              </Pressable>
            );
          }}
        />
      )}
      <Pressable style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.96 }] }]} onPress={() => router.push("/nueva-visita")}>
        <Plus color="#fff" size={30} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    backgroundColor: colors.bg,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.3 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
  accent: { marginTop: spacing.md, height: 3, width: 60, borderRadius: 999, backgroundColor: colors.brand },
  emptyWrap: { alignItems: "center", paddingTop: spacing.xl * 2, gap: spacing.sm },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.brandSoft,
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.sm,
  },
  empty: { textAlign: "center", color: colors.text, fontSize: 16, fontWeight: "700" },
  emptyHint: { textAlign: "center", color: colors.textMuted, fontSize: 13, paddingHorizontal: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg + 2,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  subject: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.text },
  badge: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 8 },
  metaFaint: { color: colors.textFaint, fontSize: 12, marginTop: 3 },
  fab: {
    position: "absolute", right: spacing.xl, bottom: spacing.xl,
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brand,
    alignItems: "center", justifyContent: "center", elevation: 8,
    shadowColor: colors.brand, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
  },
});
