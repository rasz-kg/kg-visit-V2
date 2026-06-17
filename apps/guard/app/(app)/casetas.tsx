import * as React from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { DoorOpen, ChevronRight, ShieldCheck } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { useBooth } from "@/lib/booth";
import { getBooths, type Booth } from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

export default function CasetasScreen() {
  const { profile } = useAuth();
  const { setBooth } = useBooth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [booths, setBooths] = React.useState<Booth[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getBooths().then((data) => {
      setBooths(data);
      setLoading(false);
    });
  }, []);

  async function choose(b: Booth) {
    await setBooth(b);
    router.replace("/(app)/visitas");
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.brand}>KG-<Text style={{ color: colors.brand }}>Visit</Text></Text>
        <Text style={styles.title}>Selecciona tu caseta</Text>
        <Text style={styles.subtitle}>{profile?.residentialName ?? "Residencial"}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={booths}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          ListEmptyComponent={<Text style={styles.empty}>No hay casetas registradas en tu residencial.</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => choose(item)}>
              <View style={styles.iconWrap}><DoorOpen color={colors.brand} size={22} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.tags}>
                  {item.main ? <Tag icon label="Principal" /> : null}
                  {item.doubleCheck ? <Tag label="Doble verificación" /> : null}
                </View>
              </View>
              <ChevronRight color={colors.textFaint} size={20} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function Tag({ label, icon }: { label: string; icon?: boolean }) {
  return (
    <View style={styles.tag}>
      {icon ? <ShieldCheck color={colors.brand} size={12} /> : null}
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.ink, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  brand: { color: "#fff", fontSize: 22, fontWeight: "800" },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginTop: spacing.md },
  subtitle: { color: colors.textFaint, fontSize: 13, marginTop: 4 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl, paddingHorizontal: spacing.xl },
  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.brandSoft,
    alignItems: "center", justifyContent: "center",
  },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: 4 },
  tag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },
  tagText: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
});
