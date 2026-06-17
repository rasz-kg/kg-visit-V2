import * as React from "react";
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ShieldAlert, History } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { colors, radius, spacing } from "@/lib/theme";

export default function PanicoScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = React.useState(false);
  const scale = React.useRef(new Animated.Value(1)).current;

  async function trigger() {
    setBusy(true);
    const payload = {
      residential_id: profile?.residentialId,
      house_id: profile?.houseId,
      user_id: profile?.id,
      kind: "resident",
      status: true,
    };
    const { error } = await supabase.from("panic_alerts").insert(payload as never);
    setBusy(false);
    if (error) {
      Alert.alert("No se pudo enviar", error.message);
      return;
    }
    Alert.alert(
      "Alerta enviada",
      "La caseta fue notificada de tu emergencia.",
      [
        { text: "OK", style: "cancel" },
        { text: "Ver mis alertas", onPress: () => router.push("/mis-alertas") },
      ],
    );
  }

  function onPressIn() {
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, friction: 6 }).start();
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.headerWrap}>
        <Text style={styles.title}>Botón de pánico</Text>
        <Text style={styles.subtitle}>Mantén la calma. Al presionar, la caseta recibe tu alerta de inmediato.</Text>
        <View style={styles.accent} />
      </View>

      <View style={styles.center}>
        <View style={styles.glowOuter}>
          <View style={styles.glowInner}>
            <Animated.View style={{ transform: [{ scale }] }}>
              <Pressable
                style={styles.button}
                onPress={trigger}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={busy}
              >
                {busy
                  ? <ActivityIndicator color="#fff" size="large" />
                  : <ShieldAlert color="#fff" size={72} strokeWidth={2} />}
                <Text style={styles.buttonText}>{busy ? "Enviando…" : "ENVIAR ALERTA"}</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </View>

      <Pressable style={styles.historyLink} onPress={() => router.push("/mis-alertas")} hitSlop={8}>
        <History color={colors.brand} size={16} />
        <Text style={styles.historyText}>Ver mis alertas</Text>
      </Pressable>
      <Text style={styles.footerHint}>Úsalo solo en emergencias reales.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.xl },
  headerWrap: { paddingTop: spacing.md },
  title: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 6, lineHeight: 20 },
  accent: { marginTop: spacing.md, height: 3, width: 60, borderRadius: 999, backgroundColor: colors.brand },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  glowOuter: {
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: colors.red + "11",
    alignItems: "center", justifyContent: "center",
  },
  glowInner: {
    width: 230, height: 230, borderRadius: 115,
    backgroundColor: colors.red + "22",
    alignItems: "center", justifyContent: "center",
  },
  button: {
    width: 200, height: 200, borderRadius: 100, backgroundColor: colors.red,
    alignItems: "center", justifyContent: "center", gap: spacing.sm,
    shadowColor: colors.red, shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 1.5 },
  historyLink: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "center",
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  historyText: { color: colors.brand, fontWeight: "700", fontSize: 13 },
  footerHint: { textAlign: "center", color: colors.textFaint, fontSize: 12, marginBottom: spacing.xl, fontStyle: "italic" },
});

// `radius` no se usa aquí, pero lo dejamos importado por consistencia con el resto.
void radius;
