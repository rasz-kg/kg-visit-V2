import * as React from "react";
import {
  View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, Modal,
  TextInput, Switch, Alert, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus, Trash2, UserPlus, Users } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import {
  getFrequentVisitors, createFrequentVisitor, removeFrequentVisitor, type FrequentVisitor,
} from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

export default function VisitantesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [items, setItems] = React.useState<FrequentVisitor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    const data = await getFrequentVisitors(profile?.houseId ?? null);
    setItems(data);
    setLoading(false);
  }, [profile?.houseId]);

  React.useEffect(() => { load(); }, [load]);

  function confirmRemove(it: FrequentVisitor) {
    Alert.alert("Eliminar visitante", `¿Quitar a ${it.name} de tus frecuentes?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar", style: "destructive", onPress: async () => {
          const r = await removeFrequentVisitor(it.id);
          if (r.error) Alert.alert("No se pudo eliminar", r.error);
          else {
            Alert.alert("Visitante eliminado", `${it.name} ya no está en tus frecuentes.`);
            load();
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft color={colors.text} size={26} />
        </Pressable>
        <View>
          <Text style={styles.title}>Visitantes</Text>
          <Text style={styles.subtitle}>Tus visitantes frecuentes</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}><Users color={colors.blue} size={28} /></View>
              <Text style={styles.empty}>Sin visitantes todavía</Text>
              <Text style={styles.emptyHint}>Toca el botón + para agregar tu primer visitante frecuente.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={[styles.avatar, { backgroundColor: colors.blue + "22" }]}>
                <Text style={[styles.avatarText, { color: colors.blue }]}>{(item.name ?? "?").charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.frequently ? (
                    <View style={styles.freqBadge}>
                      <Text style={styles.freqText}>Frecuente</Text>
                    </View>
                  ) : null}
                </View>
                {item.phone ? <Text style={styles.meta}>Tel: {item.phone}</Text> : null}
                {item.curp ? <Text style={styles.metaFaint}>CURP: {item.curp}</Text> : null}
              </View>
              <Pressable onPress={() => confirmRemove(item)} style={styles.delete} hitSlop={8}>
                <Trash2 color={colors.red} size={18} />
              </Pressable>
            </View>
          )}
        />
      )}

      <Pressable style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.96 }] }]} onPress={() => setModalOpen(true)}>
        <Plus color="#fff" size={30} strokeWidth={2.5} />
      </Pressable>

      <NewVisitorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => { setModalOpen(false); load(); }}
      />
    </View>
  );
}

function NewVisitorModal({
  open, onClose, onCreated,
}: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { profile } = useAuth();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [curp, setCurp] = React.useState("");
  const [frequently, setFrequently] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) { setName(""); setPhone(""); setCurp(""); setFrequently(false); }
  }, [open]);

  async function submit() {
    setBusy(true);
    const r = await createFrequentVisitor(
      { name, phone, curp, frequently },
      { residentialId: profile?.residentialId ?? null, houseId: profile?.houseId ?? null },
    );
    setBusy(false);
    if (r.error) { Alert.alert("No se pudo crear", r.error); return; }
    Alert.alert("Visitante creado", `${name} se agregó a tus visitantes.`);
    onCreated();
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHead}>
            <UserPlus color={colors.brand} size={22} />
            <Text style={styles.modalTitle}>Nuevo visitante</Text>
          </View>
          <ScrollView contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}>
            <View>
              <Text style={styles.label}>Nombre*</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nombre completo"
                placeholderTextColor={colors.textFaint}
              />
            </View>
            <View>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="55 1234 5678"
                placeholderTextColor={colors.textFaint}
                keyboardType="phone-pad"
              />
            </View>
            <View>
              <Text style={styles.label}>CURP</Text>
              <TextInput
                style={styles.input}
                value={curp}
                onChangeText={setCurp}
                placeholder="Opcional"
                placeholderTextColor={colors.textFaint}
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Marcar como frecuente</Text>
                <Text style={styles.hint}>Acceso recurrente sin tener que crearle visita.</Text>
              </View>
              <Switch
                value={frequently}
                onValueChange={setFrequently}
                trackColor={{ true: colors.brand, false: colors.border }}
                thumbColor="#fff"
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.bg, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  emptyWrap: { alignItems: "center", paddingTop: spacing.xl * 2, gap: spacing.sm },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.blue + "22",
    alignItems: "center", justifyContent: "center", marginBottom: spacing.sm,
  },
  empty: { textAlign: "center", color: colors.text, fontSize: 16, fontWeight: "700" },
  emptyHint: { textAlign: "center", color: colors.textMuted, fontSize: 13, paddingHorizontal: spacing.xl },
  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  freqBadge: { backgroundColor: colors.brandSoft, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  freqText: { color: colors.brand, fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  metaFaint: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  delete: { padding: spacing.sm },
  fab: {
    position: "absolute", right: spacing.xl, bottom: spacing.xl,
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brand,
    alignItems: "center", justifyContent: "center", elevation: 8,
    shadowColor: colors.brand, shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
  },
  modalRoot: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, maxHeight: "88%",
    borderTopWidth: 1, borderColor: colors.border,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong,
    alignSelf: "center", marginBottom: spacing.md,
  },
  modalHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  label: { fontSize: 12, fontWeight: "700", color: colors.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md + 2, paddingVertical: spacing.md, fontSize: 15,
    color: colors.text, backgroundColor: colors.bg,
  },
  hint: { color: colors.textFaint, fontSize: 12, textTransform: "none", letterSpacing: 0, fontWeight: "400" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  btn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: spacing.md + 2, borderRadius: radius.pill,
  },
  btnPrimary: { backgroundColor: colors.brand },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
  btnGhost: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.text, fontWeight: "700" },
});
