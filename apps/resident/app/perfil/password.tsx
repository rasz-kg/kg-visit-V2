import * as React from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, KeyRound } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";

export default function CambiarPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (password.length < 8) {
      Alert.alert("Contraseña muy corta", "Debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("No coincide", "La confirmación no coincide.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { Alert.alert("No se pudo actualizar", error.message); return; }
    Alert.alert("Contraseña actualizada", "Cambios guardados.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft color={colors.text} size={26} />
        </Pressable>
        <Text style={styles.title}>Cambiar contraseña</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 }}>
        <View style={styles.heroIcon}>
          <KeyRound color={colors.brand} size={28} />
        </View>
        <Text style={styles.heroText}>Elige una contraseña segura, mínimo 8 caracteres.</Text>

        <View style={styles.card}>
          <View>
            <Text style={styles.label}>Nueva contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor={colors.textFaint}
            />
          </View>
          <View style={{ marginTop: spacing.md + 2 }}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              placeholder="Repite la contraseña"
              placeholderTextColor={colors.textFaint}
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.btn, busy && { opacity: 0.5 }, pressed && { transform: [{ scale: 0.98 }] }]}
          onPress={submit}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Actualizar contraseña</Text>}
        </Pressable>
      </ScrollView>
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
  heroIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brandSoft,
    alignItems: "center", justifyContent: "center", alignSelf: "center",
    marginTop: spacing.md,
  },
  heroText: { color: colors.textMuted, fontSize: 13, textAlign: "center", paddingHorizontal: spacing.lg },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg,
  },
  label: { fontSize: 12, fontWeight: "700", color: colors.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md + 2, paddingVertical: spacing.md, fontSize: 15,
    color: colors.text, backgroundColor: colors.bg,
  },
  btn: {
    backgroundColor: colors.brand, borderRadius: radius.pill, paddingVertical: spacing.md + 4,
    alignItems: "center", marginTop: spacing.md,
    shadowColor: colors.brand, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.3 },
});
