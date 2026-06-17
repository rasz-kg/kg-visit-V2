import { getNotices } from "@/lib/data";
import { AvisosClient } from "./AvisosClient";

export default async function AvisosPage() {
  const notices = await getNotices();
  return <AvisosClient notices={notices} />;
}
