import { redirect } from "next/navigation";
import { createServerClient } from "../../lib/supabase-server";
import ProfileClient from "./profile-client";

export default async function ProfilePage() {
  const supabase = await createServerClient();
  const { data: { claims } } = await supabase.auth.getClaims();
  if (!claims?.sub) redirect("/auth");
  return <ProfileClient />;
}
