import * as React from "react";
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldAlert } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { colors, spacing } from "@/lib/theme";

export default function PanicoScreen() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = React.useState(false);

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
    if (error) Alert.alert("No se pudo enviar", error.message);
    else Alert.alert("Alerta enviada", "La caseta fue notificada de tu emergencia.");
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Botón de pánico</Text>
      <Text style={styles.subtitle}>Mantén la calma. Al presionar, la caseta recibe tu alerta de inmediato.</Text>
      <Pressable style={styles.button} onPress={trigger} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" size="large" /> : <ShieldAlert color="#fff" size={64} />}
        <Text style={styles.buttonText}>{busy ? "Enviando…" : "ENVIAR ALERTA"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  button: {
    width: 220, height: 220, borderRadius: 110, backgroundColor: colors.red,
    alignItems: "center", justifyContent: "center", gap: spacing.sm,
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 1 },
});
