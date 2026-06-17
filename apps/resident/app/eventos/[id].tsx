import * as React from "react";
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, Modal, TextInput, Alert, FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Plus, UserPlus, CalendarDays } from "lucide-react-native";
import {
  getEventDetail, getEventGuests, addEventGuest, formatDate,
  type EventDetail, type EventGuest,
} from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

export default function EventoDetalleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const [event, setEvent] = React.useState<EventDetail | null>(null);
  const [guests, setGuests] = React.useState<EventGuest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [det, g] = await Promise.all([getEventDetail(id), getEventGuests(id)]);
    setEvent(det);
    setGuests(g);
    setLoading(false);
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
            <ChevronLeft color="#fff" size={26} />
          </Pressable>
          <Text style={styles.title}>Evento</Text>
        </View>
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
            <ChevronLeft color="#fff" size={26} />
          </Pressable>
          <Text style={styles.title}>Evento</Text>
        </View>
        <Text style={styles.empty}>No se encontró el evento.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft color="#fff" size={26} />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
          <CalendarDays color="#fff" size={22} />
          <Text style={styles.title} numberOfLines={1}>{event.name}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.h2}>Detalles</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: event.open ? colors.green : colors.textFaint },
              ]}
            >
              <Text style={styles.badgeText}>{event.open ? "Abierto" : "Cerrado"}</Text>
            </View>
          </View>
          <Row label="Fecha" value={formatDate(event.dueDate)} />
          {event.finishDate ? <Row label="Finaliza" value={formatDate(event.finishDate)} /> : null}
          {event.folio ? <Row label="Folio" value={event.folio} /> : null}
          {event.spaceName ? <Row label="Espacio" value={event.spaceName} /> : null}
          {event.cars !== null ? <Row label="Autos" value={String(event.cars)} /> : null}
          {event.qrUrl ? <Row label="QR" value={event.qrUrl} last /> : <Row label="Creado" value={formatDate(event.createdAt)} last />}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.h2}>Invitados</Text>
            <Pressable style={styles.smallBtn} onPress={() => setModalOpen(true)}>
              <UserPlus color="#fff" size={16} />
              <Text style={styles.smallBtnText}>Añadir</Text>
            </Pressable>
          </View>

          {guests.length === 0 ? (
            <Text style={styles.muted}>Aún no hay invitados.</Text>
          ) : (
            <FlatList
              scrollEnabled={false}
              data={guests}
              keyExtractor={(g) => g.id}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => (
                <View style={styles.guestRow}>
                  <Text style={styles.guestName}>{item.name}</Text>
                  {item.folio ? <Text style={styles.metaFaint}>Folio: {item.folio}</Text> : null}
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      <AddGuestModal
        open={modalOpen}
        eventId={event.id}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
      />
    </View>
  );
}

function AddGuestModal({
  open, eventId, onClose, onSaved,
}: { open: boolean; eventId: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => { if (open) setName(""); }, [open]);

  async function submit() {
    setBusy(true);
    const r = await addEventGuest(eventId, name);
    setBusy(false);
    if (r.error) { Alert.alert("No se pudo añadir", r.error); return; }
    onSaved();
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <Plus color={colors.brand} size={22} />
            <Text style={styles.modalTitle}>Nuevo invitado</Text>
          </View>
          <Text style={styles.label}>Nombre*</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nombre del invitado"
            placeholderTextColor={colors.textFaint}
            autoFocus
          />
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose} disabled={busy}>
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary, busy && { opacity: 0.5 }]} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Añadir</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
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
  empty: { textAlign: "center", color: colors.textMuted, marginTop: spacing.xl, paddingHorizontal: spacing.xl },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg,
  },
  cardHead: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: spacing.sm,
  },
  h2: { fontSize: 16, fontWeight: "800", color: colors.text },
  row: {
    flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md,
  },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  badge: {
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  smallBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.brand, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  smallBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  muted: { color: colors.textMuted, fontSize: 14, paddingVertical: spacing.sm },
  sep: { height: 1, backgroundColor: colors.border },
  guestRow: { paddingVertical: spacing.md },
  guestName: { fontSize: 14, fontWeight: "600", color: colors.text },
  metaFaint: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  modalRoot: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.lg, gap: spacing.sm,
  },
  modalHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
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
