import * as React from "react";
import {
  View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Bell } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import {
  getNotifications, markNotificationViewed, formatDate, type NotificationItem,
} from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

export default function NotificacionesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!profile?.id) return;
    const data = await getNotifications(profile.id);
    setItems(data);
    setLoading(false);
    setRefreshing(false);
  }, [profile?.id]);

  React.useEffect(() => { load(); }, [load]);

  async function open(item: NotificationItem) {
    if (!item.viewed) {
      await markNotificationViewed(item.id);
      setItems((cur) => cur.map((i) => i.id === item.id ? { ...i, viewed: true } : i));
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft color={colors.text} size={26} />
        </Pressable>
        <Text style={styles.title}>Notificaciones</Text>
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
              <View style={styles.emptyIcon}><Bell color={colors.brand} size={28} /></View>
              <Text style={styles.empty}>No tienes notificaciones por ahora.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, !item.viewed && styles.cardUnread, pressed && { opacity: 0.85 }]}
              onPress={() => open(item)}
            >
              <View style={[styles.iconWrap, !item.viewed && { backgroundColor: colors.brandSoft }]}>
                <Bell color={item.viewed ? colors.textFaint : colors.brand} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.body, item.viewed && { color: colors.textMuted, fontWeight: "500" }]}>
                  {item.message}
                </Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
              {!item.viewed && <View style={styles.dot} />}
            </Pressable>
          )}
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
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brandSoft,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.sm,
  },
  empty: { textAlign: "center", color: colors.text, fontSize: 16, fontWeight: "700" },
  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  cardUnread: { borderColor: colors.brand + "88", borderWidth: 1 },
  iconWrap: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.bg,
    alignItems: "center", justifyContent: "center",
  },
  body: { color: colors.text, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  date: { color: colors.textFaint, fontSize: 12, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand },
});
