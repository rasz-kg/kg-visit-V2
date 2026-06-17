import * as React from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { updateMyProfile } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing } from "@/lib/theme";

export default function EditarPerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [name, setName] = React.useState(profile?.name ?? "");
  const [email, setEmail] = React.useState(profile?.email ?? "");
  const [phone, setPhone] = React.useState("");
  const [avatar, setAvatar] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    // Carga teléfono y avatar actuales desde la tabla users.
    if (!profile?.id) return;
    supabase.from("users").select("phone,avatar").eq("id", profile.id).maybeSingle().then((r) => {
      const row = r.data as { phone?: string | null; avatar?: string | null } | null;
      setPhone(row?.phone ?? "");
      setAvatar(row?.avatar ?? "");
    });
  }, [profile?.id]);

  async function submit() {
    if (!profile?.id) return;
    setBusy(true);
    const r = await updateMyProfile(profile.id, { name, email, phone, avatar });
    setBusy(false);
    if (r.error) { Alert.alert("No se pudo guardar", r.error); return; }
    Alert.alert("Perfil actualizado", "Los cambios se guardaron.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft color="#fff" size={26} />
        </Pressable>
        <Text style={styles.title}>Editar perfil</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Field label="Nombre*" value={name} onChange={setName} />
        <Field label="Correo" value={email} onChange={setEmail} keyboard="email-address" />
        <Field label="Teléfono" value={phone} onChange={setPhone} keyboard="phone-pad" />
        <Field label="Avatar (URL)" value={avatar} onChange={setAvatar} placeholder="https://…" />

        <Pressable
          style={[styles.btn, busy && { opacity: 0.5 }]}
          onPress={submit}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Guardar cambios</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, keyboard }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboard?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType={keyboard ?? "default"}
        autoCapitalize={keyboard === "email-address" ? "none" : "sentences"}
      />
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
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 6 },
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
});
