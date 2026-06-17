import * as React from "react";
import {
  View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";

export default function RecuperarScreen() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit() {
    if (!email.trim()) { setError("Indica tu correo."); return; }
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    setBusy(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <ChevronLeft color="#fff" size={26} />
      </Pressable>

      <View style={styles.brandRow}>
        <Text style={styles.brand}>Recuperar acceso</Text>
        <Text style={styles.tagline}>Te enviaremos un enlace por correo</Text>
      </View>

      <View style={styles.card}>
        {sent ? (
          <>
            <Text style={styles.successTitle}>¡Listo!</Text>
            <Text style={styles.successText}>
              Si el correo está registrado, te enviamos un enlace para restablecer la contraseña.
              Revisa tu bandeja de entrada (y la carpeta de spam).
            </Text>
            <Pressable style={styles.button} onPress={() => router.replace("/login")}>
              <Text style={styles.buttonText}>Volver a iniciar sesión</Text>
            </Pressable>
          </>
        ) : (
          <>
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
            {error && <Text style={styles.error}>{error}</Text>}
            <Pressable style={[styles.button, busy && { opacity: 0.5 }]} onPress={onSubmit} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar enlace de recuperación</Text>}
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, justifyContent: "center", padding: spacing.xl },
  backBtn: { position: "absolute", top: 56, left: spacing.lg, padding: 4 },
  brandRow: { alignItems: "center", marginBottom: spacing.xl },
  brand: { color: "#fff", fontSize: 26, fontWeight: "800" },
  tagline: { color: colors.textFaint, fontSize: 13, marginTop: 6 },
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15,
    color: colors.text, backgroundColor: colors.bg,
  },
  error: { color: colors.red, fontSize: 13, marginTop: spacing.md },
  button: {
    backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: spacing.md,
    alignItems: "center", marginTop: spacing.xl,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  successTitle: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  successText: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
});
