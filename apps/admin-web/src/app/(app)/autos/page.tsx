import { getPlates } from "@/lib/data";
import { AutosClient } from "./AutosClient";

export default async function AutosPage() {
  const plates = await getPlates();
  return <AutosClient plates={plates} />;
}
