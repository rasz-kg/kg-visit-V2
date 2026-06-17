import * as React from "react";
import {
  View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, Modal,
  TextInput, Alert, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus, MessageCircleQuestion } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import {
  getTickets, getTicketCategories, createTicket, formatDate,
  type TicketItem, type Catalog,
} from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

const STATUS_COLOR: Record<string, string> = {
  open: colors.amber, in_progress: colors.blue, closed: colors.green, rejected: colors.red,
};
const STATUS_LABEL: Record<string, string> = {
  open: "Abierto", in_progress: "En proceso", closed: "Cerrado", rejected: "Rechazado",
};

export default function SugerenciasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [items, setItems] = React.useState<TicketItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!profile?.id) return;
    const data = await getTickets(profile.id);
    setItems(data);
    setLoading(false);
  }, [profile?.id]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft color={colors.text} size={26} />
        </Pressable>
        <Text style={styles.title}>Sugerencias</Text>
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
              <View style={styles.emptyIcon}><MessageCircleQuestion color={colors.cyan} size={28} /></View>
              <Text style={styles.empty}>Sin sugerencias todavía</Text>
              <Text style={styles.emptyHint}>Toca el botón + para enviar la primera a administración.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const status = item.status ?? "open";
            const color = STATUS_COLOR[status] ?? colors.textMuted;
            const label = STATUS_LABEL[status] ?? status;
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
                  <View style={[styles.badge, { backgroundColor: color + "22" }]}>
                    <Text style={[styles.badgeText, { color }]}>{label}</Text>
                  </View>
                </View>
                {item.categoryName ? <Text style={styles.meta}>Categoría: {item.categoryName}</Text> : null}
                {item.description ? <Text style={styles.desc} numberOfLines={3}>{item.description}</Text> : null}
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
            );
          }}
        />
      )}

      <Pressable style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.96 }] }]} onPress={() => setModalOpen(true)}>
        <Plus color="#fff" size={30} strokeWidth={2.5} />
      </Pressable>

      <NewTicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => { setModalOpen(false); load(); }}
      />
    </View>
  );
}

function NewTicketModal({
  open, onClose, onCreated,
}: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { profile } = useAuth();
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string>("");
  const [categories, setCategories] = React.useState<Catalog[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setSubject(""); setDescription(""); setCategoryId("");
    getTicketCategories().then(setCategories);
  }, [open]);

  async function submit() {
    if (!profile?.id) return;
    setBusy(true);
    const r = await createTicket(
      { subject, description, categoryId },
      { residentialId: profile.residentialId ?? null, userId: profile.id },
    );
    setBusy(false);
    if (r.error) { Alert.alert("No se pudo crear", r.error); return; }
    Alert.alert("Sugerencia enviada", "Tu mensaje fue registrado y será atendido por administración.");
    onCreated();
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalCard}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHead}>
            <MessageCircleQuestion color={colors.brand} size={22} />
            <Text style={styles.modalTitle}>Nueva sugerencia</Text>
          </View>
          <ScrollView contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}>
            <View>
              <Text style={styles.label}>Asunto*</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="Breve título"
                placeholderTextColor={colors.textFaint}
              />
            </View>
            <View>
              <Text style={styles.label}>Categoría*</Text>
              <View style={styles.chipRow}>
                {categories.length === 0 ? (
                  <Text style={styles.hint}>Sin categorías configuradas.</Text>
                ) : (
                  categories.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setCategoryId(c.id)}
                      style={[styles.chip, categoryId === c.id && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
                    </Pressable>
                  ))
                )}
              </View>
            </View>
            <View>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Detalla tu sugerencia o queja"
                placeholderTextColor={colors.textFaint}
                multiline
              />
            </View>
          </ScrollView>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose} disabled={busy}>
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary, busy && { opacity: 0.5 }]} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Enviar</Text>}
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
  emptyWrap: { alignItems: "center", paddingTop: spacing.xl * 2, gap: spacing.sm },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.cyan + "22",
    alignItems: "center", justifyContent: "center", marginBottom: spacing.sm,
  },
  empty: { textAlign: "center", color: colors.text, fontSize: 16, fontWeight: "700" },
  emptyHint: { textAlign: "center", color: colors.textMuted, fontSize: 13, paddingHorizontal: spacing.xl },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  subject: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
  badge: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 8 },
  desc: { color: colors.text, fontSize: 14, marginTop: 6, lineHeight: 20 },
  date: { color: colors.textFaint, fontSize: 12, marginTop: 8 },
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill,
    paddingHorizontal: spacing.md + 2, paddingVertical: 9, backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  hint: { color: colors.textFaint, fontSize: 13 },
  btn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: spacing.md + 2, borderRadius: radius.pill,
  },
  btnPrimary: { backgroundColor: colors.brand },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
  btnGhost: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.text, fontWeight: "700" },
});
