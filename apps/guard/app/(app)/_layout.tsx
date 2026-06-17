import { Stack } from "expo-router";

// Pila del área autenticada de la caseta. La navegación entre selección de caseta,
// listado y menú es por rutas explícitas (no hay tab bar en la app de guardia).
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
