import * as React from "react";
import {
  View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { useAuth } from "@/lib/auth";
import { colors, radius, spacing } from "@/lib/theme";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function onSubmit() {
    setError(null);
    setBusy(true);
    const res = await signIn(email.trim(), password);
    setBusy(false);
    if (res.error) setError("Credenciales inválidas. Verifica tu correo y contraseña.");
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Banda naranja superior decorativa (firma KG) */}
      <View style={styles.brandBand}>
        <Text style={styles.brand}>KG-Visit</Text>
        <Text style={styles.tagline}>Control de accesos · Caseta</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Iniciar sesión</Text>
        <Text style={styles.cardHint}>Acceso restringido a personal de seguridad</Text>

        <Text style={[styles.label, { marginTop: spacing.lg }]}>Correo</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="guardia@correo.mx"
          placeholderTextColor={colors.textFaint}
        />
        <Text style={[styles.label, { marginTop: spacing.md }]}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.textFaint}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.button} onPress={onSubmit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Iniciar sesión</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", padding: spacing.xl, gap: spacing.lg },
  brandBand: { alignItems: "center", paddingVertical: spacing.lg },
  brand: { color: colors.brand, fontSize: 38, fontWeight: "800", letterSpacing: 0.5 },
  tagline: { color: colors.textMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: 2.5, marginTop: 6, fontWeight: "700" },
  card: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl,
    maxWidth: 480, width: "100%", alignSelf: "center",
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  cardHint: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  label: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15,
    color: colors.text, backgroundColor: colors.bg,
  },
  error: { color: colors.red, fontSize: 13, marginTop: spacing.md, fontWeight: "600" },
  button: {
    backgroundColor: colors.brand, borderRadius: radius.pill, paddingVertical: spacing.md + 2,
    alignItems: "center", marginTop: spacing.xl,
    shadowColor: colors.brand, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.3 },
});
