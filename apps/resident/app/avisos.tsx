import * as React from "react";
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Megaphone } from "lucide-react-native";
import { getNotices, formatDate, type NoticeItem } from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

const KIND_LABEL: Record<string, string> = {
  general: "General", payment: "Cobranza", emergency: "Emergencia", house: "Domicilio",
};
const KIND_COLOR: Record<string, string> = {
  general: colors.blue, payment: colors.amber, emergency: colors.red, house: colors.textMuted,
};

export default function AvisosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notices, setNotices] = React.useState<NoticeItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => { getNotices().then((n) => { setNotices(n); setLoading(false); }); }, []);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}><ChevronLeft color="#fff" size={26} /></Pressable>
        <Text style={styles.title}>Avisos</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          ListEmptyComponent={<Text style={styles.empty}>No hay avisos por ahora.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconWrap}><Megaphone color={colors.brand} size={18} /></View>
                <View style={[styles.badge, { backgroundColor: (KIND_COLOR[item.kind] ?? colors.textMuted) + "22" }]}>
                  <Text style={[styles.badgeText, { color: KIND_COLOR[item.kind] ?? colors.textMuted }]}>{KIND_LABEL[item.kind] ?? item.kind}</Text>
                </View>
              </View>
              <Text style={styles.body}>{item.description}</Text>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.ink, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconWrap: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  body: { color: colors.text, fontSize: 15, marginTop: spacing.md },
  date: { color: colors.textFaint, fontSize: 12, marginTop: spacing.sm },
});
