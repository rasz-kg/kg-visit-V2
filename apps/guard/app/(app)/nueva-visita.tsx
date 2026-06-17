import * as React from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Camera, Check } from "lucide-react-native";
import { useBooth } from "@/lib/booth";
import {
  getHouses, getServices, getTransports, getEmployeesByHouse, createGuardVisit,
  getVisitFolioById,
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

const STEP_LABELS = ["Tipo", "Domicilio", "Datos", "Transporte", "Foto", "Confirmar"] as const;

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
  // Cuando el usuario intenta avanzar sin completar el paso, encendemos el flag
  // para mostrar borde rojo + mensaje inline en los campos obligatorios.
  const [showErrors, setShowErrors] = React.useState(false);

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

  // Validación por paso — flags individuales para señalar el campo erróneo.
  const errVisitorName = kind === "visitor" && visitorName.trim().length < 2;
  const errService = kind === "service" && !serviceId;
  const errEmployee = kind === "employee" && !employeeId;
  const errHouse = !houseId;
  const errTransport = !transportId;
  const errPlate = transportNeedsPlate && plateNumber.trim().length < 2;

  function canAdvance(): boolean {
    switch (step) {
      case 1: return !!kind;
      case 2: return !errHouse;
      case 3:
        if (kind === "visitor") return !errVisitorName;
        if (kind === "service") return !errService;
        if (kind === "employee") return !errEmployee;
        return true; // resident: no extra data
      case 4:
        if (errTransport) return false;
        if (errPlate) return false;
        return true;
      case 5: return true; // foto = stub
      default: return true;
    }
  }

  // Avanzar paso: si no se cumple, marca errores y deja al usuario en el paso.
  function tryAdvance() {
    if (canAdvance()) {
      setShowErrors(false);
      setStep(step + 1);
    } else {
      setShowErrors(true);
    }
  }

  // Título del paso actual (para el banner "Paso N de 6: …" arriba del stepper).
  const STEP_TITLES = [
    "Tipo de visita",
    "Domicilio destino",
    "Datos del ingreso",
    "Transporte",
    "Foto del visitante",
    "Confirmar",
  ];

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
    // Después del insert, consultamos el folio real generado por la BD (trigger
    // / default). Si no se puede leer, mostramos mensaje genérico.
    let folio: string | null = null;
    if (res.visitId) {
      folio = await getVisitFolioById(res.visitId);
    }
    const baseMsg = giveAccessNow
      ? "La visita quedó registrada con acceso."
      : "La visita quedó autorizada.";
    const msg = folio ? `${baseMsg}\n\nFolio: ${folio}` : baseMsg;
    Alert.alert(
      folio ? `Visita creada · ${folio}` : "Visita registrada",
      msg,
      [{ text: "OK", onPress: () => router.replace("/(app)/visitas") }],
    );
  }

  return (
    <View style={styles.root}>
      {/* Header naranja */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={[styles.headerInner, isTablet && styles.headerInnerTablet]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color="#fff" size={24} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>Nueva visita</Text>
            <Text style={styles.brandHint}>Paso {step} de 6 · {booth?.name ?? "Sin caseta"}</Text>
          </View>
        </View>
      </View>

      {/* Stepper visual de círculos numerados con conexión */}
      <View style={styles.stepperWrap}>
        <View style={[styles.stepBanner, isTablet && styles.stepperTablet]}>
          <Text style={styles.stepBannerText}>
            Paso {step} de 6: <Text style={styles.stepBannerStrong}>{STEP_TITLES[step - 1]}</Text>
          </Text>
        </View>
        <View style={[styles.stepper, isTablet && styles.stepperTablet]}>
          {STEP_LABELS.map((label, idx) => {
            const n = idx + 1;
            const done = n < step;
            const active = n === step;
            return (
              <React.Fragment key={label}>
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      done && styles.stepCircleDone,
                      active && styles.stepCircleActive,
                    ]}
                  >
                    {done ? (
                      <Check color="#fff" size={14} />
                    ) : (
                      <Text style={[styles.stepCircleText, active && { color: "#fff" }]}>{n}</Text>
                    )}
                  </View>
                  {isTablet && (
                    <Text style={[styles.stepLabel, (active || done) && { color: colors.text, fontWeight: "700" }]}>
                      {label}
                    </Text>
                  )}
                </View>
                {n < STEP_LABELS.length && (
                  <View style={[styles.stepLine, n < step && { backgroundColor: colors.brand }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={[
        { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 3 },
        isTablet && { padding: spacing.xl, maxWidth: 960, alignSelf: "center", width: "100%" },
      ]}>
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
            {showErrors && errHouse && (
              <Text style={styles.errorText}>Selecciona un domicilio destino para continuar.</Text>
            )}
            <ScrollView style={{ maxHeight: 380, marginTop: spacing.sm }}>
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
                <TextInput
                  style={[styles.input, showErrors && errVisitorName && styles.inputError]}
                  value={visitorName} onChangeText={setVisitorName}
                  placeholder="Nombre completo" placeholderTextColor={colors.textFaint} />
                {showErrors && errVisitorName && (
                  <Text style={styles.errorText}>Escribe el nombre completo (mínimo 2 caracteres).</Text>
                )}
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
                {showErrors && errService && (
                  <Text style={styles.errorText}>Selecciona el servicio que llega.</Text>
                )}
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
                {showErrors && errEmployee && (
                  <Text style={styles.errorText}>Selecciona el empleado que ingresa.</Text>
                )}
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
            {showErrors && errTransport && (
              <Text style={styles.errorText}>Selecciona cómo llega la visita.</Text>
            )}
            {transportNeedsPlate && (
              <>
                <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Número de placa *</Text>
                <TextInput
                  style={[styles.input, showErrors && errPlate && styles.inputError]}
                  value={plateNumber} onChangeText={setPlateNumber}
                  placeholder="ABC-1234" placeholderTextColor={colors.textFaint} autoCapitalize="characters" />
                {showErrors && errPlate && (
                  <Text style={styles.errorText}>Captura la placa (mínimo 2 caracteres).</Text>
                )}
                <Text style={styles.faint}>Validación REPUVE — próximamente.</Text>
              </>
            )}
          </Step>
        )}

        {step === 5 && (
          <Step n="05" title="Foto del visitante" hint="Captura opcional (próximamente)">
            <View style={styles.photoStub}>
              <View style={styles.photoIcon}>
                <Camera color={colors.brand} size={48} />
              </View>
              <Text style={styles.photoStubText}>Captura desde cámara — próximamente.</Text>
              <Pressable style={styles.simBtn}
                onPress={() => Alert.alert("Cámara", "La captura desde cámara se habilita en próxima versión.")}>
                <Text style={styles.simBtnText}>Simular captura</Text>
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
              <Pressable style={[styles.primaryBtn, styles.primaryBtnGhost]}
                onPress={() => finish(false)} disabled={busy}>
                <Text style={[styles.primaryBtnText, { color: colors.brand }]}>Solo autorizar</Text>
              </Pressable>
            </View>
          </Step>
        )}
      </ScrollView>

      {/* Footer con anterior/siguiente */}
      {step < 6 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={[styles.footerInner, isTablet && { maxWidth: 960, alignSelf: "center", width: "100%" }]}>
            <Pressable
              style={styles.footerGhost}
              onPress={() => {
                setShowErrors(false);
                if (step > 1) setStep(step - 1);
                else router.back();
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "700" }}>{step > 1 ? "Anterior" : "Cancelar"}</Text>
            </Pressable>
            <Pressable
              style={styles.footerPrimary}
              onPress={tryAdvance}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>Siguiente</Text>
              <ChevronRight color="#fff" size={18} />
            </Pressable>
          </View>
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
  header: { backgroundColor: colors.brand, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  headerInner: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerInnerTablet: { maxWidth: 1200, width: "100%", alignSelf: "center" },
  backBtn: {
    width: 38, height: 38, borderRadius: radius.pill,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.headerOverlay,
  },
  brand: { color: "#fff", fontSize: 22, fontWeight: "800" },
  brandHint: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2, fontWeight: "600" },

  // Stepper de círculos numerados con conexión
  stepperWrap: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md, gap: spacing.sm },
  stepBanner: {
    paddingHorizontal: spacing.md,
    width: "100%",
  },
  stepBannerText: {
    color: colors.textMuted, fontSize: 13, fontWeight: "600",
  },
  stepBannerStrong: {
    color: colors.text, fontWeight: "800",
  },
  stepper: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, gap: 4 },
  stepperTablet: { maxWidth: 960, alignSelf: "center", width: "100%", paddingHorizontal: spacing.xl },
  stepItem: { alignItems: "center", gap: 4 },
  stepCircle: {
    width: 28, height: 28, borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  stepCircleActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  stepCircleDone: { backgroundColor: colors.brand, borderColor: colors.brand },
  stepCircleText: { fontSize: 12, fontWeight: "800", color: colors.textMuted },
  stepLabel: { fontSize: 11, color: colors.textFaint, fontWeight: "600" },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, borderRadius: 1 },

  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#0f172a", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  stepHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  stepNum: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: colors.brandDark, fontWeight: "800", fontSize: 14 },
  stepTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  stepHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  gridRow2: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: 6 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 9, backgroundColor: "#fff" },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { color: colors.text, fontSize: 13, fontWeight: "700" },
  chipTextActive: { color: "#fff" },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md + 2,
    fontSize: 15, color: colors.text, backgroundColor: colors.bg,
  },
  inputError: { borderColor: colors.red, borderWidth: 1.5 },
  errorText: {
    color: colors.red, fontSize: 12, fontWeight: "700",
    marginTop: 6,
  },
  faint: { color: colors.textFaint, fontSize: 13, paddingVertical: spacing.sm },
  kindCard: {
    flexBasis: "48%", flexGrow: 1, padding: spacing.lg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff",
  },
  kindCardOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  kindLabel: { fontSize: 15, fontWeight: "800", color: colors.text },
  kindHint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  houseCard: {
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: "#fff", marginBottom: spacing.sm,
  },
  houseCardOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  houseAddr: { fontSize: 14, fontWeight: "800", color: colors.text },
  houseMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  photoStub: { alignItems: "center", paddingVertical: spacing.xl },
  photoIcon: {
    width: 96, height: 96, borderRadius: radius.pill,
    backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center",
  },
  photoStubText: { color: colors.textMuted, fontSize: 14, marginTop: spacing.md, textAlign: "center" },
  simBtn: {
    backgroundColor: colors.brand, borderRadius: radius.pill,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, marginTop: spacing.md,
  },
  simBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  summaryLabel: { color: colors.textMuted, fontSize: 13 },
  summaryValue: { color: colors.text, fontSize: 14, fontWeight: "700", maxWidth: "60%", textAlign: "right" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, flexGrow: 1,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2, borderRadius: radius.pill,
  },
  primaryBtnGhost: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: colors.brand },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  footerInner: { flexDirection: "row", gap: spacing.sm, padding: spacing.md },
  footerGhost: {
    flex: 1, paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: "center",
    flexDirection: "row", justifyContent: "center",
    backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border,
  },
  footerPrimary: {
    flex: 1, paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: "center",
    flexDirection: "row", justifyContent: "center", gap: 6,
    backgroundColor: colors.brand,
  },
});
