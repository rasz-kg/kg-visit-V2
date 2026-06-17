import * as React from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useBooth } from "@/lib/booth";
import { colors } from "@/lib/theme";

// Punto de entrada del área autenticada: si no hay caseta elegida → selección;
// si ya hay → listado del día.
export default function AppIndex() {
  const { booth, loading } = useBooth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink }}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }
  return <Redirect href={booth ? "/(app)/visitas" : "/(app)/casetas"} />;
}
