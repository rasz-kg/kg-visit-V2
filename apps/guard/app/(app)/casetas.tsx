import * as React from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { DoorOpen, ChevronRight, ShieldCheck } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { useBooth } from "@/lib/booth";
import { getBooths, type Booth } from "@/lib/data";
import { colors, radius, spacing, useIsTablet } from "@/lib/theme";

// Pantalla 0 — Selección de caseta. Header naranja (firma KG) y grid de
// casetas en cards con icono cuadrado naranja-soft.
export default function CasetasScreen() {
  const { profile } = useAuth();
  const { setBooth } = useBooth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isTablet = useIsTablet();
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
        <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
          <Text style={styles.brand}>KG-Visit</Text>
          <Text style={styles.title}>Selecciona tu caseta</Text>
          <Text style={styles.subtitle}>{profile?.residentialName ?? "Residencial"}</Text>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={booths}
          keyExtractor={(b) => b.id}
          numColumns={isTablet ? 2 : 1}
          key={isTablet ? "grid-2" : "list-1"}
          columnWrapperStyle={isTablet ? { gap: spacing.md } : undefined}
          contentContainerStyle={[
            { padding: spacing.md, gap: spacing.md },
            isTablet && { padding: spacing.xl, maxWidth: 1200, alignSelf: "center", width: "100%" },
          ]}
          ListEmptyComponent={<Text style={styles.empty}>No hay casetas registradas en tu residencial.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, isTablet && { flex: 1 }, pressed && styles.cardPressed]}
              onPress={() => choose(item)}
            >
              <View style={styles.iconWrap}><DoorOpen color={colors.brand} size={26} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.tags}>
                  {item.main ? <Tag icon label="Principal" /> : null}
                  {item.doubleCheck ? <Tag label="Doble verificación" /> : null}
                </View>
              </View>
              <ChevronRight color={colors.textFaint} size={22} />
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
  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  headerInner: { gap: 4 },
  headerInnerTablet: { maxWidth: 1200, width: "100%", alignSelf: "center" },
  brand: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: 0.3 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: spacing.md },
  subtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 4, fontWeight: "500" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl, paddingHorizontal: spacing.xl },
  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  cardPressed: { backgroundColor: "#f1f5f9" },
  iconWrap: {
    width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.brandSoft,
    alignItems: "center", justifyContent: "center",
  },
  name: { fontSize: 17, fontWeight: "800", color: colors.text },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: 6 },
  tag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.border,
  },
  tagText: { fontSize: 11, color: colors.textMuted, fontWeight: "700" },
});
