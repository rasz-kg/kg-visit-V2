import * as React from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Camera } from "lucide-react-native";
import { useBooth } from "@/lib/booth";
import {
  getHouses, getServices, getTransports, getEmployeesByHouse, createGuardVisit,
  type HouseRow, type ServiceRow, type TransportRow, type EmployeeRow,
} from "@/lib/data";
import { colors, radius, spacing, useIsTablet } from "@/lib/theme";

// Wizard "Nueva visita" (pantallas 6–12 de docs/13). Reusa el patrón Step+Chip
// del wizard de residente y crea la visita contra Supabase real.
type VisitKindUI = "visitor" | "service" | "employee" | "resident";

const KIND_OPTIONS: { key: VisitKindUI; label: string; hint: string }[] = [
  { key: "visitor", label: "Conocido / Familia", hint: "Visita personal o familiar" },
  { key: "service", label: "Servicio", hint: "Plomería, paquetería, etc." },
  { key: "employee", label: "Empleado doméstico", hint: "Personal asignado a un domicilio" },
  { key: "resident", label: "Colono", hint: "Ingreso de un residente" },
];

export default function NuevaVisitaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { booth } = useBooth();
  const isTablet = useIsTablet();

  // Paso del wizard (1..6).
  const [step, setStep] = React.useState(1);

  // Datos del formulario
  const [kind, setKind] = React.useState<VisitKindUI>("visitor");
  const [houseId, setHouseId] = React.useState<string | null>(null);
  const [houseSearch, setHouseSearch] = React.useState("");

  const [visitorName, setVisitorName] = React.useState("");
  const [visitorCurp, setVisitorCurp] = React.useState("");
  const [visitorPhone, setVisitorPhone] = React.useState("");
  const [subject, setSubject] = React.useState("");

  const [serviceId, setServiceId] = React.useState<string | null>(null);
  const [serviceDetails, setServiceDetails] = React.useState("");
  const [employeeId, setEmployeeId] = React.useState<string | null>(null);

  const [transportId, setTransportId] = React.useState<string | null>(null);
  const [plateNumber, setPlateNumber] = React.useState("");

  const [busy, setBusy] = React.useState(false);

  // Catálogos
  const [houses, setHouses] = React.useState<HouseRow[]>([]);
  const [services, setServices] = React.useState<ServiceRow[]>([]);
  const [transports, setTransports] = React.useState<TransportRow[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeRow[]>([]);

  // Carga catálogos al inicio
  React.useEffect(() => {
    getServices().then(setServices);
    getTransports().then(setTransports);
  }, []);

  // Casas: recargar al cambiar el buscador (debounced manual via useEffect).
  React.useEffect(() => {
    const t = setTimeout(() => { getHouses(houseSearch).then(setHouses); }, 200);
    return () => clearTimeout(t);
  }, [houseSearch]);

  // Empleados: dependen de la casa elegida (solo si kind=employee).
  React.useEffect(() => {
    if (kind !== "employee" || !houseId) { setEmployees([]); return; }
    getEmployeesByHouse(houseId).then(setEmployees);
  }, [kind, houseId]);

  const selectedHouse = React.useMemo(() => houses.find((h) => h.id === houseId) ?? null, [houses, houseId]);
  const selectedService = React.useMemo(() => services.find((s) => s.id === serviceId) ?? null, [services, serviceId]);
  const selectedTransport = React.useMemo(() => transports.find((t) => t.id === transportId) ?? null, [transports, transportId]);
  const transportNeedsPlate = selectedTransport?.plates ?? false;

  // Validación por paso
  function canAdvance(): boolean {
    switch (step) {
      case 1: return !!kind;
      case 2: return !!houseId;
      case 3:
        if (kind === "visitor") return visitorName.trim().length >= 2;
        if (kind === "service") return !!serviceId;
        if (kind === "employee") return !!employeeId;
        return true; // resident: no extra data
      case 4:
        if (!transportId) return false;
        if (transportNeedsPlate) return plateNumber.trim().length >= 2;
        return true;
      case 5: return true; // foto = stub
      default: return true;
    }
  }

  async function finish(giveAccessNow: boolean) {
    if (!booth) { Alert.alert("Sin caseta", "Selecciona una caseta antes de crear la visita."); return; }
    if (!houseId) { Alert.alert("Falta domicilio", "Selecciona un domicilio destino."); return; }
    setBusy(true);
    const res = await createGuardVisit({
      kind,
      houseId,
      visitorName: kind === "visitor" ? visitorName : undefined,
      visitorCurp: kind === "visitor" ? visitorCurp : null,
      visitorPhone: kind === "visitor" ? visitorPhone : null,
      serviceId: kind === "service" ? serviceId : null,
      employeeId: kind === "employee" ? employeeId : null,
      transportId,
      plateNumber: transportNeedsPlate ? plateNumber : null,
      subject,
      details: kind === "service" && selectedService?.hasDetails ? serviceDetails : null,
      giveAccessNow,
    }, booth.id);
    setBusy(false);
    if (res.error) {
      Alert.alert("No se pudo crear la visita", res.error);
      return;
    }
    Alert.alert(
      "Visita creada",
      giveAccessNow ? "La visita quedó registrada con acceso." : "La visita quedó autorizada.",
      [{ text: "OK", onPress: () => router.replace("/(app)/visitas") }],
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.back}><ChevronLeft color="#fff" size={26} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>Nueva visita</Text>
          <Text style={styles.brandHint}>Paso {step} de 6 · {booth?.name ?? "Sin caseta"}</Text>
        </View>
      </View>

      {/* Barra de progreso simple */}
      <View style={styles.progressRow}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <View key={n} style={[styles.progressDot, n <= step ? styles.progressDotOn : null]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 }}>
        {step === 1 && (
          <Step n="01" title="Tipo de visita" hint="¿Quién va a ingresar?">
            <View style={isTablet ? styles.gridRow2 : styles.row}>
              {KIND_OPTIONS.map((o) => (
                <KindCard key={o.key} active={kind === o.key} label={o.label} hint={o.hint}
                  onPress={() => setKind(o.key)} />
              ))}
            </View>
          </Step>
        )}

        {step === 2 && (
          <Step n="02" title="Domicilio destino" hint="A qué casa va la visita">
            <TextInput style={styles.input} value={houseSearch} onChangeText={setHouseSearch}
              placeholder="Buscar por dirección…" placeholderTextColor={colors.textFaint} />
            <ScrollView style={{ maxHeight: 360, marginTop: spacing.sm }}>
              <View style={isTablet ? styles.gridRow2 : { gap: spacing.sm }}>
                {houses.map((h) => (
                  <Pressable key={h.id}
                    style={[styles.houseCard, houseId === h.id && styles.houseCardOn,
                      isTablet ? { flexBasis: "48%", flexGrow: 1 } : null]}
                    onPress={() => setHouseId(h.id)}
                  >
                    <Text style={[styles.houseAddr, houseId === h.id && { color: "#fff" }]}>{h.address}</Text>
                    <Text style={[styles.houseMeta, houseId === h.id && { color: "#ffd8b5" }]}>
                      {h.cluster ?? "Sin cluster"}{h.defaulter ? " · MOROSO" : ""}
                    </Text>
                  </Pressable>
                ))}
                {houses.length === 0 && <Text style={styles.faint}>Sin domicilios para esta búsqueda.</Text>}
              </View>
            </ScrollView>
          </Step>
        )}

        {step === 3 && (
          <Step n="03" title="Datos del ingreso" hint="Quién es y a qué viene">
            {kind === "visitor" && (
              <>
                <Text style={styles.fieldLabel}>Nombre del visitante *</Text>
                <TextInput style={styles.input} value={visitorName} onChangeText={setVisitorName}
                  placeholder="Nombre completo" placeholderTextColor={colors.textFaint} />
                <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>CURP (opcional)</Text>
                <TextInput style={styles.input} value={visitorCurp} onChangeText={setVisitorCurp}
                  placeholder="CURP" placeholderTextColor={colors.textFaint} autoCapitalize="characters" />
                <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Teléfono (opcional)</Text>
                <TextInput style={styles.input} value={visitorPhone} onChangeText={setVisitorPhone}
                  placeholder="10 dígitos" placeholderTextColor={colors.textFaint} keyboardType="phone-pad" />
              </>
            )}
            {kind === "service" && (
              <>
                <Text style={styles.fieldLabel}>Servicio *</Text>
                <View style={styles.row}>
                  {services.map((s) => (
                    <Chip key={s.id} label={s.name} active={serviceId === s.id} onPress={() => setServiceId(s.id)} />
                  ))}
                  {services.length === 0 && <Text style={styles.faint}>Sin servicios configurados.</Text>}
                </View>
                {selectedService?.hasDetails && (
                  <>
                    <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Detalles del servicio</Text>
                    <TextInput style={styles.input} value={serviceDetails} onChangeText={setServiceDetails}
                      placeholder="Detalles" placeholderTextColor={colors.textFaint} />
                  </>
                )}
              </>
            )}
            {kind === "employee" && (
              <>
                <Text style={styles.fieldLabel}>Empleado del domicilio *</Text>
                <View style={styles.row}>
                  {employees.map((e) => (
                    <Chip key={e.id} label={e.name + (e.folio ? ` · ${e.folio}` : "")}
                      active={employeeId === e.id} onPress={() => setEmployeeId(e.id)} />
                  ))}
                  {employees.length === 0 && (
                    <Text style={styles.faint}>
                      {houseId ? "Sin empleados registrados para este domicilio." : "Selecciona un domicilio primero."}
                    </Text>
                  )}
                </View>
              </>
            )}
            {kind === "resident" && (
              <Text style={styles.faint}>Ingreso de colono — no se piden datos adicionales.</Text>
            )}
            <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Asunto (opcional)</Text>
            <TextInput style={styles.input} value={subject} onChangeText={setSubject}
              placeholder="Ej. Visita familiar" placeholderTextColor={colors.textFaint} />
          </Step>
        )}

        {step === 4 && (
          <Step n="04" title="Transporte" hint="¿Cómo llega?">
            <View style={styles.row}>
              {transports.map((t) => (
                <Chip key={t.id} label={t.name + (t.plates ? " (placa)" : "")}
                  active={transportId === t.id} onPress={() => setTransportId(t.id)} />
              ))}
              {transports.length === 0 && <Text style={styles.faint}>Sin transportes configurados.</Text>}
            </View>
            {transportNeedsPlate && (
              <>
                <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Número de placa *</Text>
                <TextInput style={styles.input} value={plateNumber} onChangeText={setPlateNumber}
                  placeholder="ABC-1234" placeholderTextColor={colors.textFaint} autoCapitalize="characters" />
                <Text style={styles.faint}>Validación REPUVE — próximamente.</Text>
              </>
            )}
          </Step>
        )}

        {step === 5 && (
          <Step n="05" title="Foto del visitante" hint="Captura opcional (próximamente)">
            <View style={styles.photoStub}>
              <Camera color={colors.textMuted} size={48} />
              <Text style={styles.photoStubText}>Captura desde cámara — próximamente.</Text>
              <Pressable style={[styles.qrBtn, { marginTop: spacing.md }]}
                onPress={() => Alert.alert("Cámara", "La captura desde cámara se habilita en próxima versión.")}>
                <Text style={styles.qrBtnText}>Simular captura</Text>
              </Pressable>
            </View>
          </Step>
        )}

        {step === 6 && (
          <Step n="06" title="Confirmar" hint="Revisa los datos y crea la visita">
            <SummaryRow label="Tipo" value={KIND_OPTIONS.find((o) => o.key === kind)?.label ?? kind} />
            <SummaryRow label="Domicilio" value={selectedHouse?.address ?? "—"} />
            {kind === "visitor" && <SummaryRow label="Visitante" value={visitorName || "—"} />}
            {kind === "service" && <SummaryRow label="Servicio" value={selectedService?.name ?? "—"} />}
            {kind === "employee" && (
              <SummaryRow label="Empleado" value={employees.find((e) => e.id === employeeId)?.name ?? "—"} />
            )}
            <SummaryRow label="Transporte" value={selectedTransport?.name ?? "—"} />
            {transportNeedsPlate && <SummaryRow label="Placa" value={plateNumber.toUpperCase() || "—"} />}
            {subject && <SummaryRow label="Asunto" value={subject} />}
            <SummaryRow label="Caseta" value={booth?.name ?? "—"} />

            <View style={[styles.actions, { marginTop: spacing.lg }]}>
              <Pressable style={[styles.primaryBtn, { backgroundColor: colors.brand }]}
                onPress={() => finish(true)} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.primaryBtnText}>Crear y dar acceso</Text>
                )}
              </Pressable>
              <Pressable style={[styles.primaryBtn, { backgroundColor: colors.ink800 }]}
                onPress={() => finish(false)} disabled={busy}>
                <Text style={styles.primaryBtnText}>Solo autorizar</Text>
              </Pressable>
            </View>
          </Step>
        )}
      </ScrollView>

      {/* Footer con anterior/siguiente */}
      {step < 6 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Pressable
            style={[styles.footerBtn, { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
          >
            <Text style={{ color: colors.text, fontWeight: "700" }}>{step > 1 ? "Anterior" : "Cancelar"}</Text>
          </Pressable>
          <Pressable
            style={[styles.footerBtn, { backgroundColor: colors.brand, opacity: canAdvance() ? 1 : 0.4 }]}
            onPress={() => canAdvance() && setStep(step + 1)}
            disabled={!canAdvance()}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>Siguiente</Text>
            <ChevronRight color="#fff" size={18} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

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
      <View style={{ marginTop: spacing.md }}>{children}</View>
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

function KindCard({ label, hint, active, onPress }: { label: string; hint: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}
      style={[styles.kindCard, active && styles.kindCardOn]}
    >
      <Text style={[styles.kindLabel, active && { color: "#fff" }]}>{label}</Text>
      <Text style={[styles.kindHint, active && { color: "#ffd8b5" }]}>{hint}</Text>
    </Pressable>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.ink, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  back: { padding: 4 },
  brand: { color: "#fff", fontSize: 22, fontWeight: "800" },
  brandHint: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  progressRow: { flexDirection: "row", gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.ink },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.ink800 },
  progressDotOn: { backgroundColor: colors.brand },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  stepHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  stepNum: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: colors.brandDark, fontWeight: "800" },
  stepTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  stepHint: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  gridRow2: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: 6 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 8, backgroundColor: colors.bg },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 15, color: colors.text, backgroundColor: colors.bg },
  faint: { color: colors.textFaint, fontSize: 13, paddingVertical: spacing.sm },
  kindCard: {
    flexBasis: "48%", flexGrow: 1, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg,
  },
  kindCardOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  kindLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  kindHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  houseCard: {
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bg, marginBottom: spacing.sm,
  },
  houseCardOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  houseAddr: { fontSize: 14, fontWeight: "700", color: colors.text },
  houseMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  photoStub: { alignItems: "center", paddingVertical: spacing.xl },
  photoStubText: { color: colors.textMuted, fontSize: 13, marginTop: spacing.md, textAlign: "center" },
  qrBtn: { backgroundColor: colors.ink800, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  qrBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  summaryLabel: { color: colors.textMuted, fontSize: 13 },
  summaryValue: { color: colors.text, fontSize: 14, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, flexGrow: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2, borderRadius: radius.md },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  footer: {
    flexDirection: "row", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.card,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  footerBtn: {
    flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: "center",
    flexDirection: "row", justifyContent: "center", gap: 6,
  },
});
