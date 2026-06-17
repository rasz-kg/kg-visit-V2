import * as React from "react";
import {
  View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus, CalendarDays } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { getEvents, formatDate, type EventItem } from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

export default function EventosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [items, setItems] = React.useState<EventItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const data = await getEvents(profile?.id ?? null);
    setItems(data);
    setLoading(false);
  }, [profile?.id]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft color="#fff" size={26} />
        </Pressable>
        <View>
          <Text style={styles.title}>Eventos</Text>
          <Text style={styles.subtitle}>Tus reuniones con invitados</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}><CalendarDays color={colors.red} size={28} /></View>
              <Text style={styles.empty}>Sin eventos todavía</Text>
              <Text style={styles.emptyHint}>Toca el botón + para crear tu primer evento.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push({ pathname: "/eventos/[id]", params: { id: item.id } })}
            >
              <View style={styles.iconWrap}>
                <CalendarDays color={colors.brand} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: item.open ? colors.green : colors.textFaint },
                    ]}
                  >
                    <Text style={styles.badgeText}>{item.open ? "Abierto" : "Cerrado"}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>Fecha: {formatDate(item.dueDate)}</Text>
                {item.folio ? <Text style={styles.metaFaint}>Folio: {item.folio}</Text> : null}
                {item.spaceName ? <Text style={styles.metaFaint}>Espacio: {item.spaceName}</Text> : null}
              </View>
            </Pressable>
          )}
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push("/eventos/nuevo")}>
        <Plus color="#fff" size={28} />
      </Pressable>
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
  subtitle: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  emptyWrap: { alignItems: "center", paddingTop: spacing.xl * 2, gap: spacing.sm },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.red + "22",
    alignItems: "center", justifyContent: "center", marginBottom: spacing.sm,
  },
  empty: { textAlign: "center", color: colors.text, fontSize: 16, fontWeight: "700" },
  emptyHint: { textAlign: "center", color: colors.textMuted, fontSize: 13, paddingHorizontal: spacing.xl },
  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.brandSoft,
    alignItems: "center", justifyContent: "center",
  },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  metaFaint: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  badge: {
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  fab: {
    position: "absolute", right: spacing.lg, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand,
    alignItems: "center", justifyContent: "center", elevation: 4,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
});
