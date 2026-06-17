import { notFound } from "next/navigation";
import { getEntity } from "@/lib/entities";
import { listEntity, loadFkOptions, type Row } from "@/lib/crud";
import { EntityClient } from "./EntityClient";

export default async function EntityPage({ params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  const def = getEntity(entity);
  if (!def) notFound();
  const [rows, fkOptions] = await Promise.all([listEntity(def), loadFkOptions(def)]);
  // icon (función) no es serializable hacia el client; se omite.
  const { icon: _icon, ...clientDef } = def;
  void _icon;
  return <EntityClient def={clientDef} rows={rows as Row[]} fkOptions={fkOptions} />;
}
