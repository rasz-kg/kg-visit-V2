import { notFound } from "next/navigation";
import { getVisitDetail } from "@/lib/data";
import { VisitDetailClient } from "./VisitDetailClient";

export default async function VisitaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visit = await getVisitDetail(id);
  if (!visit) notFound();
  return <VisitDetailClient visit={visit} />;
}
