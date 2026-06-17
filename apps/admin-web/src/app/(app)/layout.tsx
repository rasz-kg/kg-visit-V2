import { AppShell } from "@/components/shell";
import { getResidentialName } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const residentialName = await getResidentialName();
  return <AppShell residentialName={residentialName}>{children}</AppShell>;
}
