import { redirect } from "next/navigation";
import { createServerClient } from "../lib/supabase-server";
import NetworkClient from "./network-client";

export default async function HomePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return <NetworkClient />;
}
