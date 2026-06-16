import { getVisits } from "@/lib/data";
import { VisitasClient } from "./VisitasClient";

export default async function VisitasPage() {
  const visits = await getVisits();
  return <VisitasClient visits={visits} />;
}
