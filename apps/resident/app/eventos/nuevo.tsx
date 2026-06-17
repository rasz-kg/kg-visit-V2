import * as React from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView, Alert, Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, CalendarDays } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { createEvent, getSpaces, type Space } from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

export default function NuevoEventoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const [name, setName] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [open, setOpen] = React.useState(true);
  const [carsStr, setCarsStr] = React.useState("");
  const [spaceId, setSpaceId] = React.useState<string | null>(null);
  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => { getSpaces().then(setSpaces); }, []);

  async function submit() {
    if (!profile?.id) return;
    setBusy(true);
    const carsNum = carsStr.trim() ? Number(carsStr) : null;
    const r = await createEvent(
      {
        name,
        dueDate,
        open,
        cars: carsNum !== null && !Number.isNaN(carsNum) ? carsNum : null,
        spaceId,
      },
      {
        residentialId: profile.residentialId,
        houseId: profile.houseId,
        userId: profile.id,
      },
    );
    setBusy(false);
    if (r.error) { Alert.alert("No se pudo crear", r.error); return; }
    Alert.alert("Evento creado", "El evento se guardó correctamente.", [
      { text: "OK", onPress: () => {
        if (r.id) router.replace({ pathname: "/eventos/[id]", params: { id: r.id } });
        else router.replace("/eventos");
      } },
    ]);
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft color="#fff" size={26} />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <CalendarDays color="#fff" size={22} />
          <Text style={styles.title}>Nuevo evento</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Field label="Nombre del evento*" value={name} onChange={setName} placeholder="Cumpleaños, reunión…" />
        <Field
          label="Fecha y hora*"
          value={dueDate}
          onChange={setDueDate}
          placeholder="2026-12-31T20:00"
        />
        <Text style={styles.helper}>Formato: YYYY-MM-DDTHH:MM</Text>

        <Field label="Autos esperados" value={carsStr} onChange={setCarsStr} placeholder="Ej. 10" keyboard="number-pad" />

        <View>
          <Text style={styles.label}>Espacio / amenidad (opcional)</Text>
          <View style={styles.chips}>
            <Chip label="Sin espacio" active={!spaceId} onPress={() => setSpaceId(null)} />
            {spaces.map((s) => (
              <Chip key={s.id} label={s.name} active={spaceId === s.id} onPress={() => setSpaceId(s.id)} />
            ))}
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Evento abierto</Text>
            <Text style={styles.helper}>Permite acceso a invitados que se anuncien en caseta.</Text>
          </View>
          <Switch
            value={open}
            onValueChange={setOpen}
            trackColor={{ true: colors.brand, false: colors.border }}
          />
        </View>

        <Pressable
          style={[styles.btn, busy && { opacity: 0.5 }]}
          onPress={submit}
          disabled={busy}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Crear evento</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, value, onChange, placeholder, keyboard }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboard?: "default" | "number-pad";
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
  helper: { fontSize: 12, color: colors.textFaint, marginTop: -spacing.sm },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15,
    color: colors.text, backgroundColor: colors.card,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  switchRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  btn: {
    backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: spacing.md + 2,
    alignItems: "center", marginTop: spacing.md,
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
