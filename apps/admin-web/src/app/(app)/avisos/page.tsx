import { Plus, Megaphone } from "lucide-react";
import { Badge, Button, Card, CardBody, PageHeader } from "@/components/ui";
import { notices } from "@/lib/mock";
import { formatDateTime } from "@/lib/utils";

const KIND_TONE = { general: "blue", payment: "amber", emergency: "red", house: "slate" } as const;
const KIND_LABEL = { general: "General", payment: "Cobranza", emergency: "Emergencia", house: "Domicilio" } as const;

export default function AvisosPage() {
  return (
    <>
      <PageHeader
        title="Avisos"
        subtitle="Comunicados a toda la empresa/fraccionamiento o a un departamento."
        actions={<Button><Plus className="h-4 w-4" /> Nuevo aviso</Button>}
      />
      <div className="space-y-3">
        {notices.map((n) => (
          <Card key={n.id}>
            <CardBody className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><Megaphone className="h-5 w-5" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{n.title}</p>
                  <Badge tone={KIND_TONE[n.kind]}>{KIND_LABEL[n.kind]}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
