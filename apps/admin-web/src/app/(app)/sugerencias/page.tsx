import { getTickets } from "@/lib/data";
import { SugerenciasClient } from "./SugerenciasClient";

export default async function SugerenciasPage() {
  const tickets = await getTickets();
  return <SugerenciasClient tickets={tickets} />;
}
