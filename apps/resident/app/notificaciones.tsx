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
          <ChevronLeft color="#fff" size={26} />
        </Pressable>
        <Text style={styles.title}>Notificaciones</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<Text style={styles.empty}>No tienes notificaciones por ahora.</Text>}
          renderItem={({ item }) => (
            <Pressable style={[styles.card, !item.viewed && styles.cardUnread]} onPress={() => open(item)}>
              <View style={styles.iconWrap}>
                <Bell color={item.viewed ? colors.textFaint : colors.brand} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.body}>{item.message}</Text>
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
    backgroundColor: colors.ink, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  cardUnread: { borderColor: colors.brand },
  iconWrap: {
    width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.brandSoft,
    alignItems: "center", justifyContent: "center",
  },
  body: { color: colors.text, fontSize: 14, fontWeight: "600" },
  date: { color: colors.textFaint, fontSize: 12, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand },
});
