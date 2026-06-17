import { notFound } from "next/navigation";
import { getHouseDetail } from "@/lib/data";
import { HouseDetailClient } from "./HouseDetailClient";

export default async function DepartamentoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const house = await getHouseDetail(id);
  if (!house) notFound();
  return <HouseDetailClient house={house} />;
}
