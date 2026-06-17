import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { colors, radius, spacing } from "@/lib/theme";

export default function AvisosPrivacidadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft color="#fff" size={26} />
        </Pressable>
        <Text style={styles.title}>Aviso de privacidad</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={styles.card}>
          <Text style={styles.h1}>Tratamiento de datos personales</Text>
          <Text style={styles.p}>
            KG-Visit recopila los datos estrictamente necesarios para operar el control de visitas
            del residencial: nombre, domicilio asignado, contacto, y la actividad de tus visitas
            registradas. Los datos se almacenan en Supabase con cifrado en tránsito y reposo.
          </Text>

          <Text style={styles.h1}>Uso de la información</Text>
          <Text style={styles.p}>
            La administración del residencial utiliza esta información para validar accesos,
            atender pánicos y emitir reportes. No se comparten datos con terceros con fines
            comerciales.
          </Text>

          <Text style={styles.h1}>Tus derechos (ARCO)</Text>
          <Text style={styles.p}>
            Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos
            comunicándolo a la administración del residencial. Puedes eliminar tu cuenta
            desde la opción correspondiente en este perfil.
          </Text>

          <Text style={styles.hint}>
            Este aviso es un texto placeholder operacional para la versión demo. El texto
            legal definitivo lo proporciona la administración por residencial.
          </Text>
        </View>
      </ScrollView>
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
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, gap: spacing.sm,
  },
  h1: { fontSize: 15, fontWeight: "800", color: colors.text, marginTop: spacing.sm },
  p: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  hint: { fontSize: 12, color: colors.textFaint, marginTop: spacing.md, fontStyle: "italic" },
});
