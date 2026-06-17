import { getHouses } from "@/lib/data";
import { DepartamentosClient } from "./DepartamentosClient";

export default async function DepartamentosPage() {
  const houses = await getHouses();
  return <DepartamentosClient houses={houses} />;
}
