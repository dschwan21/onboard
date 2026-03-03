import { redirect } from "next/navigation";

import { selectMaybeSingle } from "@/lib/supabase/query-helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function getCurrentUserProfile() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await selectMaybeSingle<ProfileRow>(supabase, "profiles", "*", {
    column: "id",
    value: user.id
  });

  return { supabase, user, profile };
}

export async function requireAdmin() {
  const context = await getCurrentUserProfile();

  if (context.profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return context;
}
