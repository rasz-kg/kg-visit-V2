import * as React from "react";
import {
  View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, Modal,
  TextInput, Alert, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus, Trash2, Pencil, Briefcase } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import {
  getEmployees, createEmployee, updateEmployee, deleteEmployee, type Employee, type EmployeeInput,
} from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

export default function StaffScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [items, setItems] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<Employee | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    const data = await getEmployees(profile?.houseId ?? null);
    setItems(data);
    setLoading(false);
  }, [profile?.houseId]);

  React.useEffect(() => { load(); }, [load]);

  function openNew() { setEditing(null); setModalOpen(true); }
  function openEdit(e: Employee) { setEditing(e); setModalOpen(true); }

  function confirmRemove(e: Employee) {
    Alert.alert("Eliminar empleado", `¿Quitar a ${e.name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar", style: "destructive", onPress: async () => {
          const r = await deleteEmployee(e.id);
          if (r.error) Alert.alert("No se pudo eliminar", r.error);
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
          <Text style={styles.title}>Staff</Text>
          <Text style={styles.subtitle}>Empleados domésticos de tu casa</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          ListEmptyComponent={<Text style={styles.empty}>Aún no tienes empleados registrados.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                {item.days ? <Text style={styles.meta}>Días: {item.days}</Text> : null}
                {(item.timeStart || item.timeEnd) ? (
                  <Text style={styles.meta}>Horario: {item.timeStart ?? "—"} a {item.timeEnd ?? "—"}</Text>
                ) : null}
                {item.folio ? <Text style={styles.metaFaint}>Folio: {item.folio}</Text> : null}
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

      <EmployeeFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
      />
    </View>
  );
}

function EmployeeFormModal({
  open, editing, onClose, onSaved,
}: { open: boolean; editing: Employee | null; onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth();
  const [form, setForm] = React.useState<EmployeeInput>({
    name: "", days: "", timeStart: "", timeEnd: "", folio: "", credential: "",
  });
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        days: editing.days ?? "",
        timeStart: editing.timeStart ?? "",
        timeEnd: editing.timeEnd ?? "",
        folio: editing.folio ?? "",
        credential: editing.credential ?? "",
      });
    } else {
      setForm({ name: "", days: "", timeStart: "", timeEnd: "", folio: "", credential: "" });
    }
  }, [open, editing]);

  async function submit() {
    setBusy(true);
    const r = editing
      ? await updateEmployee(editing.id, form)
      : await createEmployee(form, {
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
            <Briefcase color={colors.brand} size={22} />
            <Text style={styles.modalTitle}>{editing ? "Editar empleado" : "Nuevo empleado"}</Text>
          </View>
          <ScrollView contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}>
            <Field label="Nombre*" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Días" value={form.days} onChange={(v) => setForm({ ...form, days: v })} placeholder="Lu, Ma, Mi, Ju, Vi" />
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Field label="Entrada" value={form.timeStart} onChange={(v) => setForm({ ...form, timeStart: v })} placeholder="08:00" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Salida" value={form.timeEnd} onChange={(v) => setForm({ ...form, timeEnd: v })} placeholder="17:00" />
              </View>
            </View>
            <Field label="Folio" value={form.folio ?? ""} onChange={(v) => setForm({ ...form, folio: v })} placeholder="Opcional" />
            <Field label="Credencial" value={form.credential ?? ""} onChange={(v) => setForm({ ...form, credential: v })} placeholder="Opcional" />
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

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
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
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15,
    color: colors.text, backgroundColor: colors.bg,
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
