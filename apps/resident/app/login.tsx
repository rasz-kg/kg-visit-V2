import * as React from "react";
import {
  View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors, radius, spacing } from "@/lib/theme";

export default function LoginScreen() {
  const router = useRouter();
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
        <View style={styles.accent} />
      </View>

      <View style={styles.card}>
        <Text style={styles.welcome}>Bienvenido</Text>
        <Text style={styles.welcomeHint}>Ingresa con tu cuenta de residente.</Text>

        <Text style={[styles.label, { marginTop: spacing.lg }]}>Correo</Text>
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
        <Pressable
          style={({ pressed }) => [styles.button, busy && { opacity: 0.6 }, pressed && { transform: [{ scale: 0.98 }] }]}
          onPress={onSubmit}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Iniciar sesión</Text>}
        </Pressable>
        <Pressable
          onPress={() => router.push("/recuperar")}
          style={{ marginTop: 12, alignSelf: "center" }}
        >
          <Text style={{ color: colors.brand, fontSize: 14, fontWeight: "600" }}>
            ¿Olvidaste tu contraseña?
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", padding: spacing.xl },
  brandRow: { alignItems: "center", marginBottom: spacing.xl },
  brand: { color: colors.text, fontSize: 42, fontWeight: "800", letterSpacing: 0.5 },
  tagline: { color: colors.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 3, marginTop: 6 },
  accent: { marginTop: spacing.md, height: 3, width: 60, borderRadius: 999, backgroundColor: colors.brand },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  welcome: { color: colors.text, fontSize: 22, fontWeight: "800" },
  welcomeHint: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  label: { fontSize: 12, fontWeight: "700", color: colors.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md + 2, paddingVertical: spacing.md, fontSize: 15,
    color: colors.text, backgroundColor: colors.bg,
  },
  error: { color: colors.red, fontSize: 13, marginTop: spacing.md, fontWeight: "600" },
  button: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    marginTop: spacing.xl,
    shadowColor: colors.brand,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.3 },
});
