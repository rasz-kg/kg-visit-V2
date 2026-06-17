import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Booth } from "./data";

const STORAGE_KEY = "kg-guard-booth";

interface BoothState {
  booth: Booth | null;
  loading: boolean;
  setBooth: (booth: Booth | null) => Promise<void>;
}

const BoothContext = React.createContext<BoothState | undefined>(undefined);

// Mantiene la caseta elegida por el guardia, persistida entre sesiones de app.
export function BoothProvider({ children }: { children: React.ReactNode }) {
  const [booth, setBoothState] = React.useState<Booth | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setBoothState(JSON.parse(raw) as Booth);
        } catch {
          // caseta corrupta en storage: se ignora.
        }
      }
      setLoading(false);
    });
  }, []);

  const setBooth = React.useCallback(async (next: Booth | null) => {
    setBoothState(next);
    if (next) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <BoothContext.Provider value={{ booth, loading, setBooth }}>
      {children}
    </BoothContext.Provider>
  );
}

export function useBooth(): BoothState {
  const ctx = React.useContext(BoothContext);
  if (!ctx) throw new Error("useBooth debe usarse dentro de <BoothProvider>");
  return ctx;
}
