import { getUsers } from "@/lib/data";
import { UsuariosClient } from "./UsuariosClient";

export default async function UsuariosPage() {
  const users = await getUsers();
  return <UsuariosClient users={users} />;
}
