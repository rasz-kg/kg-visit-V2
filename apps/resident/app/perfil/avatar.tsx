import * as React from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView, Alert, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, UserCircle2, Trash2 } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { updateAvatar } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";

export default function AvatarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [url, setUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from("users")
      .select("avatar")
      .eq("id", profile.id)
      .maybeSingle()
      .then((r) => {
        const row = r.data as { avatar?: string | null } | null;
        setUrl(row?.avatar ?? "");
        setLoading(false);
      });
  }, [profile?.id]);

  async function save() {
    if (!profile?.id) return;
    const trimmed = url.trim();
    if (!trimmed) {
      Alert.alert("URL requerida", "Pega un enlace de imagen o usa 'Quitar avatar'.");
      return;
    }
    setBusy(true);
    const r = await updateAvatar(profile.id, trimmed);
    setBusy(false);
    if (r.error) { Alert.alert("No se pudo guardar", r.error); return; }
    Alert.alert("Avatar actualizado", "Tu foto de perfil se actualizó.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  async function remove() {
    if (!profile?.id) return;
    Alert.alert("Quitar avatar", "¿Eliminar tu foto de perfil?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Quitar", style: "destructive", onPress: async () => {
          setBusy(true);
          const r = await updateAvatar(profile.id, null);
          setBusy(false);
          if (r.error) { Alert.alert("No se pudo quitar", r.error); return; }
          setUrl("");
          Alert.alert("Avatar eliminado", "Tu foto de perfil fue removida.");
        },
      },
    ]);
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft color="#fff" size={26} />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <UserCircle2 color="#fff" size={22} />
          <Text style={styles.title}>Foto de perfil</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={styles.previewWrap}>
          {loading ? (
            <ActivityIndicator color={colors.brand} />
          ) : url.trim() ? (
            <Image source={{ uri: url.trim() }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={[styles.preview, styles.previewEmpty]}>
              <UserCircle2 color={colors.textFaint} size={80} />
            </View>
          )}
        </View>

        <View>
          <Text style={styles.label}>URL de imagen</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://…/avatar.jpg"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            keyboardType="url"
          />
          <Text style={styles.helper}>Pega un enlace público a tu imagen (JPG/PNG).</Text>
        </View>

        <Pressable
          style={[styles.btn, busy && { opacity: 0.5 }]}
          onPress={save}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Guardar avatar</Text>}
        </Pressable>

        <Pressable
          style={[styles.btnDanger, busy && { opacity: 0.5 }]}
          onPress={remove}
          disabled={busy || !url.trim()}
        >
          <Trash2 color={colors.red} size={16} />
          <Text style={styles.btnDangerText}>Quitar avatar</Text>
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
  previewWrap: { alignItems: "center", marginVertical: spacing.lg },
  preview: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card,
  },
  previewEmpty: { alignItems: "center", justifyContent: "center" },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 6 },
  helper: { fontSize: 12, color: colors.textFaint, marginTop: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15,
    color: colors.text, backgroundColor: colors.card,
  },
  btn: {
    backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: spacing.md + 2,
    alignItems: "center", marginTop: spacing.md,
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  btnDanger: {
    flexDirection: "row", gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.md, paddingVertical: spacing.md,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.red,
  },
  btnDangerText: { color: colors.red, fontWeight: "700", fontSize: 15 },
});
