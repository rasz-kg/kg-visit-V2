import { getBlacklist } from "@/lib/data";
import { ListaNegraClient } from "./ListaNegraClient";

export default async function ListaNegraPage() {
  const { plates, incidents } = await getBlacklist();
  return <ListaNegraClient plates={plates} incidents={incidents} />;
}
