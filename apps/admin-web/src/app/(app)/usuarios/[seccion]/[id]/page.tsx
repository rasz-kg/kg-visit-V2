import { notFound } from "next/navigation";
import { getSection } from "@/lib/sections";
import { getUserDetail } from "@/lib/data";
import { UserDetailClient } from "./UserDetailClient";

export default async function UsuarioDetallePage({
  params,
}: {
  params: Promise<{ seccion: string; id: string }>;
}) {
  const { seccion, id } = await params;
  const section = getSection(seccion);
  if (!section) notFound();
  // Sólo usuarios "users" tienen detalle ampliado; los visitantes se quedan en el listado.
  if (section.source === "visitors") notFound();
  const user = await getUserDetail(id);
  if (!user) notFound();
  return (
    <UserDetailClient
      user={user}
      section={{
        key: section.key,
        title: section.title,
        singular: section.singular,
      }}
    />
  );
}
