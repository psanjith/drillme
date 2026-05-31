import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Delete user data in order (session_questions first due to FK)
    await supabase.from("session_questions")
      .delete()
      .in("session_id",
        supabase.from("sessions").select("id").eq("user_id", user.id)
      );
    await supabase.from("sessions").delete().eq("user_id", user.id);
    await supabase.from("weakness_profile").delete().eq("user_id", user.id);
    await supabase.from("speaking_sessions").delete().eq("user_id", user.id);
    await supabase.from("speaking_profile").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);

    // Delete the auth user — requires service role key
    const admin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await admin.auth.admin.deleteUser(user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete account error:", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
