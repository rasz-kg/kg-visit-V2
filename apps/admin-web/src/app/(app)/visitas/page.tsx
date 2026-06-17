import { getVisits, getHouses } from "@/lib/data";
import { VisitasClient } from "./VisitasClient";

export default async function VisitasPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [visits, houses] = await Promise.all([getVisits(), getHouses()]);
  const houseOptions = houses.map((h) => ({ id: h.id, address: h.address }));
  return <VisitasClient visits={visits} houses={houseOptions} initialQuery={q ?? ""} />;
}
