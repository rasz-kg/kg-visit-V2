import * as React from "react";
import {
  View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, Modal,
  TextInput, Alert, ScrollView, Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus, Trash2, Pencil, Users } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import {
  getFamilyMembers, createFamilyMember, updateFamilyMember, disableFamilyMember,
  type FamilyMember, type FamilyMemberInput,
} from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

export default function FamiliaresScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [items, setItems] = React.useState<FamilyMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<FamilyMember | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const data = await getFamilyMembers(profile?.houseId ?? null, profile?.id ?? null);
    setItems(data);
    setLoading(false);
  }, [profile?.houseId, profile?.id]);

  React.useEffect(() => { load(); }, [load]);

  function openNew() { setEditing(null); setModalOpen(true); }
  function openEdit(f: FamilyMember) { setEditing(f); setModalOpen(true); }

  function confirmRemove(f: FamilyMember) {
    Alert.alert("Quitar familiar", `¿Quitar a ${f.name} del departamento?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Quitar", style: "destructive", onPress: async () => {
          const r = await disableFamilyMember(f.id);
          if (r.error) Alert.alert("No se pudo quitar", r.error);
          else load();
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
        <View>
          <Text style={styles.title}>Familiares</Text>
          <Text style={styles.subtitle}>Integrantes del departamento</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          ListEmptyComponent={<Text style={styles.empty}>Aún no hay otros familiares en este domicilio.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.representative ? (
                    <View style={styles.badge}><Text style={styles.badgeText}>Representante</Text></View>
                  ) : null}
                </View>
                {item.email ? <Text style={styles.meta}>{item.email}</Text> : null}
                {item.phone ? <Text style={styles.metaFaint}>{item.phone}</Text> : null}
              </View>
              <Pressable onPress={() => openEdit(item)} style={styles.iconBtn}>
                <Pencil color={colors.brand} size={18} />
              </Pressable>
              <Pressable onPress={() => confirmRemove(item)} style={styles.iconBtn}>
                <Trash2 color={colors.red} size={18} />
              </Pressable>
            </View>
          )}
        />
      )}

      <Pressable style={styles.fab} onPress={openNew}>
        <Plus color="#fff" size={28} />
      </Pressable>

      <FamilyFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
      />
    </View>
  );
}

function FamilyFormModal({
  open, editing, onClose, onSaved,
}: { open: boolean; editing: FamilyMember | null; onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth();
  const [form, setForm] = React.useState<FamilyMemberInput>({
    name: "", email: "", phone: "", representative: false,
  });
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        email: editing.email ?? "",
        phone: editing.phone ?? "",
        representative: editing.representative,
      });
    } else {
      setForm({ name: "", email: "", phone: "", representative: false });
    }
  }, [open, editing]);

  async function submit() {
    setBusy(true);
    const r = editing
      ? await updateFamilyMember(editing.id, form)
      : await createFamilyMember(form, {
        residentialId: profile?.residentialId ?? null,
        houseId: profile?.houseId ?? null,
      });
    setBusy(false);
    if (r.error) { Alert.alert("No se pudo guardar", r.error); return; }
    onSaved();
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <Users color={colors.brand} size={22} />
            <Text style={styles.modalTitle}>{editing ? "Editar familiar" : "Nuevo familiar"}</Text>
          </View>
          <ScrollView contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}>
            <Field label="Nombre*" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Correo" value={form.email ?? ""} onChange={(v) => setForm({ ...form, email: v })} placeholder="opcional@correo.mx" keyboard="email-address" />
            <Field label="Teléfono" value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} placeholder="Opcional" keyboard="phone-pad" />
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Representante del departamento</Text>
                <Text style={styles.helper}>Indica si esta persona representa al domicilio.</Text>
              </View>
              <Switch
                value={form.representative}
                onValueChange={(v) => setForm({ ...form, representative: v })}
                trackColor={{ true: colors.brand, false: colors.border }}
              />
            </View>
          </ScrollView>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose} disabled={busy}>
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary, busy && { opacity: 0.5 }]} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Guardar</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
  subtitle: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl, paddingHorizontal: spacing.xl },
  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  metaFaint: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  badge: {
    backgroundColor: colors.brandSoft, paddingHorizontal: spacing.sm,
    paddingVertical: 2, borderRadius: radius.sm,
  },
  badgeText: { color: colors.brandDark, fontSize: 11, fontWeight: "700" },
  iconBtn: { padding: spacing.sm },
  fab: {
    position: "absolute", right: spacing.lg, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand,
    alignItems: "center", justifyContent: "center", elevation: 4,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  modalRoot: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, maxHeight: "85%",
  },
  modalHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 6 },
  helper: { fontSize: 12, color: colors.textFaint, marginTop: 2 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15,
    color: colors.text, backgroundColor: colors.bg,
  },
  switchRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  btn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: spacing.md + 2, borderRadius: radius.md,
  },
  btnPrimary: { backgroundColor: colors.brand },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
  btnGhost: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.text, fontWeight: "700" },
});
