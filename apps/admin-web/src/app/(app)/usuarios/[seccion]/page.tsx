import { notFound } from "next/navigation";
import { getSection } from "@/lib/sections";
import { getPeople } from "@/lib/data";
import { PeopleClient } from "./PeopleClient";

export default async function SeccionPage({ params }: { params: Promise<{ seccion: string }> }) {
  const { seccion } = await params;
  const section = getSection(seccion);
  if (!section) notFound();

  const people = await getPeople(section);

  // No se serializan funciones/iconos al cliente: se pasa solo data simple.
  return (
    <PeopleClient
      people={people}
      section={{
        key: section.key,
        title: section.title,
        subtitle: section.subtitle,
        singular: section.singular,
        source: section.source,
      }}
    />
  );
}
