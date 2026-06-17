import * as React from "react";
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, AlertTriangle, Check } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { disableMyAccount } from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

export default function BorrarCuentaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();
  const [accepted, setAccepted] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  function confirm() {
    if (!accepted) return;
    Alert.alert(
      "Borrar cuenta",
      "Esta acción desactivará tu cuenta y no podrás iniciar sesión. ¿Deseas continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Borrar definitivamente", style: "destructive", onPress: doDelete },
      ],
    );
  }

  async function doDelete() {
    if (!profile?.id) return;
    setBusy(true);
    const r = await disableMyAccount(profile.id);
    if (r.error) {
      setBusy(false);
      Alert.alert("No se pudo borrar", r.error);
      return;
    }
    await signOut();
    setBusy(false);
    router.replace("/login");
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft color="#fff" size={26} />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <AlertTriangle color="#fff" size={22} />
          <Text style={styles.title}>Borrar cuenta</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={styles.warningCard}>
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }}>
            <AlertTriangle color={colors.red} size={22} />
            <Text style={styles.warningTitle}>Acción irreversible</Text>
          </View>
          <Text style={styles.warningText}>
            Al borrar tu cuenta:
          </Text>
          <Text style={styles.bullet}>• Tu acceso a KG-Visit se desactivará de inmediato.</Text>
          <Text style={styles.bullet}>• Perderás visibilidad de tus visitas, eventos y reservaciones.</Text>
          <Text style={styles.bullet}>• La administración del residencial conservará el historial requerido por ley.</Text>
          <Text style={styles.bullet}>• Para reactivar tu cuenta tendrás que contactar a la administración.</Text>
          <Text style={styles.warningText}>
            Esta operación no puede deshacerse desde la app.
          </Text>
        </View>

        <Pressable
          style={[styles.checkRow, accepted && styles.checkRowActive]}
          onPress={() => setAccepted((v) => !v)}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
            {accepted ? <Check color="#fff" size={16} /> : null}
          </View>
          <Text style={styles.checkText}>
            Entiendo que esta acción es irreversible y deseo proceder.
          </Text>
        </Pressable>

        <Pressable
          style={[styles.btnDanger, (!accepted || busy) && { opacity: 0.4 }]}
          onPress={confirm}
          disabled={!accepted || busy}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnDangerText}>Borrar cuenta permanentemente</Text>}
        </Pressable>

        <Pressable style={styles.cancelBtn} onPress={() => router.back()} disabled={busy}>
          <Text style={styles.cancelText}>Cancelar y volver</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.ink, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  warningCard: {
    backgroundColor: "#fef2f2", borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.red, gap: spacing.sm,
  },
  warningTitle: { fontSize: 16, fontWeight: "800", color: colors.red, flex: 1 },
  warningText: { fontSize: 14, color: colors.text, marginTop: spacing.sm, fontWeight: "600" },
  bullet: { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginLeft: spacing.sm },
  checkRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  checkRowActive: { borderColor: colors.brand },
  checkbox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkText: { flex: 1, fontSize: 14, color: colors.text, fontWeight: "600" },
  btnDanger: {
    backgroundColor: colors.red, borderRadius: radius.md, paddingVertical: spacing.md + 2,
    alignItems: "center", marginTop: spacing.md,
  },
  btnDangerText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  cancelBtn: { alignItems: "center", padding: spacing.md },
  cancelText: { color: colors.textMuted, fontWeight: "600", fontSize: 14 },
});
