import * as React from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { getTransports, getServices, createResidentVisit, type Catalog } from "@/lib/data";
import { colors, radius, spacing } from "@/lib/theme";

const VALIDITIES = [24, 48, 72];
const WHENS = [
  { key: "now", label: "Ahora", offsetMs: 0 },
  { key: "1h", label: "En 1 hora", offsetMs: 60 * 60 * 1000 },
  { key: "tomorrow", label: "Mañana", offsetMs: 24 * 60 * 60 * 1000 },
];

function Step({ n, title, hint, children }: { n: string; title: string; hint: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.stepHead}>
        <View style={styles.stepNum}><Text style={styles.stepNumText}>{n}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepTitle}>{title}</Text>
          <Text style={styles.stepHint}>{hint}</Text>
        </View>
      </View>
      <View style={{ marginTop: spacing.md + 2 }}>{children}</View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function NuevaVisitaScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [transports, setTransports] = React.useState<Catalog[]>([]);
  const [services, setServices] = React.useState<Catalog[]>([]);
  const [when, setWhen] = React.useState("now");
  const [validity, setValidity] = React.useState(24);
  const [transportId, setTransportId] = React.useState<string | null>(null);
  const [kind, setKind] = React.useState<"visitor" | "service">("visitor");
  const [visitorName, setVisitorName] = React.useState("");
  const [serviceId, setServiceId] = React.useState<string | null>(null);
  const [subject, setSubject] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    getTransports().then(setTransports);
    getServices().then(setServices);
  }, []);

  async function submit() {
    setBusy(true);
    const offset = WHENS.find((w) => w.key === when)?.offsetMs ?? 0;
    const dueDate = new Date(Date.now() + offset).toISOString();
    const res = await createResidentVisit(
      { kind, subject, visitorName, serviceId, transportId, validity, dueDate },
      { id: profile!.id, residentialId: profile!.residentialId, houseId: profile!.houseId },
    );
    setBusy(false);
    if (res.error) { Alert.alert("No se pudo crear", res.error); return; }
    Alert.alert("Visita creada", "Quedó registrada como pendiente.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.back}><ChevronLeft color={colors.text} size={26} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>Nueva visita</Text>
          <Text style={styles.brandHint}>Configura los datos y genera el pase.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 3 }}>
        <Step n="01" title="Fecha y hora" hint="Cuándo estará disponible la visita">
          <View style={styles.row}>
            {WHENS.map((w) => <Chip key={w.key} label={w.label} active={when === w.key} onPress={() => setWhen(w.key)} />)}
          </View>
        </Step>

        <Step n="02" title="Vigencia" hint="Cuántas horas será válida">
          <View style={styles.row}>
            {VALIDITIES.map((v) => <Chip key={v} label={`${v} h`} active={validity === v} onPress={() => setValidity(v)} />)}
          </View>
        </Step>

        <Step n="03" title="Transporte" hint="Cómo llega la visita">
          <View style={styles.row}>
            {transports.map((t) => <Chip key={t.id} label={t.name} active={transportId === t.id} onPress={() => setTransportId(t.id)} />)}
            {transports.length === 0 && <Text style={styles.faint}>Sin transportes configurados.</Text>}
          </View>
        </Step>

        <Step n="04" title="Tipo y datos" hint="A quién esperas">
          <View style={[styles.row, { marginBottom: spacing.md }]}>
            <Chip label="Conocido / Familia" active={kind === "visitor"} onPress={() => setKind("visitor")} />
            <Chip label="Servicio" active={kind === "service"} onPress={() => setKind("service")} />
          </View>
          {kind === "visitor" ? (
            <TextInput style={styles.input} value={visitorName} onChangeText={setVisitorName}
              placeholder="Nombre del visitante" placeholderTextColor={colors.textFaint} />
          ) : (
            <View style={styles.row}>
              {services.map((s) => <Chip key={s.id} label={s.name} active={serviceId === s.id} onPress={() => setServiceId(s.id)} />)}
              {services.length === 0 && <Text style={styles.faint}>Sin servicios configurados.</Text>}
            </View>
          )}
          <TextInput style={[styles.input, { marginTop: spacing.md }]} value={subject} onChangeText={setSubject}
            placeholder="Asunto / motivo (ej. Visita familiar)" placeholderTextColor={colors.textFaint} />
        </Step>

        <Pressable style={({ pressed }) => [styles.submit, busy && { opacity: 0.6 }, pressed && { transform: [{ scale: 0.98 }] }]} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Crear visita</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { padding: 4 },
  brand: { color: colors.text, fontSize: 22, fontWeight: "800" },
  brandHint: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  stepNum: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.brand,
    alignItems: "center", justifyContent: "center",
    shadowColor: colors.brand, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  stepNumText: { color: "#fff", fontWeight: "800", fontSize: 13, letterSpacing: 0.5 },
  stepTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  stepHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill,
    paddingHorizontal: spacing.md + 2, paddingVertical: 9,
    backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md + 2, paddingVertical: spacing.md,
    fontSize: 15, color: colors.text, backgroundColor: colors.bg,
  },
  faint: { color: colors.textFaint, fontSize: 13 },
  submit: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 4,
    alignItems: "center",
    marginTop: spacing.sm,
    shadowColor: colors.brand, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
});
