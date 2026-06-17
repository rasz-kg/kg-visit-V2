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
      <View style={styles.brandRow}>
        <Text style={styles.brand}>KG-<Text style={{ color: colors.brand }}>Visit</Text></Text>
        <Text style={styles.tagline}>Visitor Control</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Correo</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="tu@correo.mx"
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
  root: { flex: 1, backgroundColor: colors.ink, justifyContent: "center", padding: spacing.xl },
  brandRow: { alignItems: "center", marginBottom: spacing.xl },
  brand: { color: "#fff", fontSize: 36, fontWeight: "800", letterSpacing: 0.5 },
  tagline: { color: colors.textFaint, fontSize: 12, textTransform: "uppercase", letterSpacing: 3, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15, color: colors.text, backgroundColor: colors.bg,
  },
  error: { color: colors.red, fontSize: 13, marginTop: spacing.md },
  button: {
    backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: spacing.md,
    alignItems: "center", marginTop: spacing.xl,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
