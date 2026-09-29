import { redirect } from "next/navigation";
import { createServerClient } from "../lib/supabase-server";
import NetworkClient from "./network-client";

export default async function HomePage() {
  const supabase = await createServerClient();
  const { data: { claims } } = await supabase.auth.getClaims();

  if (!claims?.sub) redirect("/auth");

  return <NetworkClient />;
}
