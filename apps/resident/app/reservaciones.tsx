import * as React from "react";
import {
  View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, Modal,
  TextInput, Alert, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus, CalendarDays } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import {
  getReservations, getSpaces, createReservation, formatDate,
  type ReservationItem, type Space,
} from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

const STATUS_COLOR: Record<string, string> = {
  pending: colors.amber, approved: colors.green, denied: colors.red, canceled: colors.textMuted,
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", approved: "Aprobada", denied: "Denegada", canceled: "Cancelada",
};

export default function ReservacionesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [items, setItems] = React.useState<ReservationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!profile?.id) return;
    const data = await getReservations(profile.id);
    setItems(data);
    setLoading(false);
  }, [profile?.id]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft color="#fff" size={26} />
        </Pressable>
        <Text style={styles.title}>Reservaciones</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
          ListEmptyComponent={<Text style={styles.empty}>Aún no tienes reservaciones.</Text>}
          renderItem={({ item }) => {
            const st = item.status ?? "pending";
            const color = STATUS_COLOR[st] ?? colors.textMuted;
            const label = STATUS_LABEL[st] ?? st;
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.subject} numberOfLines={1}>{item.spaceName ?? "Amenidad"}</Text>
                  <View style={[styles.badge, { backgroundColor: color + "22" }]}>
                    <Text style={[styles.badgeText, { color }]}>{label}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>De: {formatDate(item.startDate)}</Text>
                <Text style={styles.meta}>A: {formatDate(item.endDate)}</Text>
                {item.reason ? <Text style={styles.metaFaint}>Motivo: {item.reason}</Text> : null}
                {item.pay && item.price != null ? (
                  <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                ) : null}
              </View>
            );
          }}
        />
      )}

      <Pressable style={styles.fab} onPress={() => setModalOpen(true)}>
        <Plus color="#fff" size={28} />
      </Pressable>

      <NewReservationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => { setModalOpen(false); load(); }}
      />
    </View>
  );
}

function NewReservationModal({
  open, onClose, onCreated,
}: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { profile } = useAuth();
  const [spaceId, setSpaceId] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setSpaceId(""); setStartDate(""); setEndDate(""); setReason("");
    getSpaces().then(setSpaces);
  }, [open]);

  async function submit() {
    if (!profile?.id) return;
    setBusy(true);
    const r = await createReservation(
      { spaceId, startDate, endDate, reason },
      { residentialId: profile.residentialId ?? null, userId: profile.id },
    );
    setBusy(false);
    if (r.error) { Alert.alert("No se pudo reservar", r.error); return; }
    onCreated();
  }

  const selected = spaces.find((s) => s.id === spaceId);

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <CalendarDays color={colors.brand} size={22} />
            <Text style={styles.modalTitle}>Nueva reservación</Text>
          </View>
          <ScrollView contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}>
            <View>
              <Text style={styles.label}>Amenidad*</Text>
              <View style={styles.chipRow}>
                {spaces.length === 0 ? (
                  <Text style={styles.hint}>Sin amenidades disponibles.</Text>
                ) : (
                  spaces.map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => setSpaceId(s.id)}
                      style={[styles.chip, spaceId === s.id && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, spaceId === s.id && styles.chipTextActive]}>{s.name}</Text>
                    </Pressable>
                  ))
                )}
              </View>
              {selected?.pay && selected.price != null ? (
                <Text style={styles.priceHint}>Costo: ${selected.price.toFixed(2)}</Text>
              ) : null}
            </View>
            <View>
              <Text style={styles.label}>Inicio*</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD HH:MM"
                placeholderTextColor={colors.textFaint}
              />
            </View>
            <View>
              <Text style={styles.label}>Fin*</Text>
              <TextInput
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD HH:MM"
                placeholderTextColor={colors.textFaint}
              />
            </View>
            <View>
              <Text style={styles.label}>Motivo*</Text>
              <TextInput
                style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]}
                value={reason}
                onChangeText={setReason}
                placeholder="Ej. cumpleaños familiar"
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
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Reservar</Text>}
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
    backgroundColor: colors.ink, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  subject: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text, marginRight: spacing.sm },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  metaFaint: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  price: { color: colors.brandDark, fontWeight: "800", fontSize: 14, marginTop: 6 },
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 999,
    paddingHorizontal: spacing.md, paddingVertical: 8, backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  hint: { color: colors.textFaint, fontSize: 13 },
  priceHint: { color: colors.brandDark, fontSize: 12, fontWeight: "700", marginTop: spacing.sm },
  btn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: spacing.md + 2, borderRadius: radius.md,
  },
  btnPrimary: { backgroundColor: colors.brand },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
  btnGhost: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.text, fontWeight: "700" },
});
