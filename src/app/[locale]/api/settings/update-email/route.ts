import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  email: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Body>;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data, error } = await supabase.auth.updateUser({
      email,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to update email." },
        { status: 400 }
      );
    }

    const appliedEmail = data.user?.email ?? null;
    if (appliedEmail === email) {
      const { error: publicUserError } = await supabase
        .from("users")
        .update({
          email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (publicUserError) {
        return NextResponse.json(
          { error: publicUserError.message || "Failed to sync public user email." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: data.user?.id ?? user.id,
          email: appliedEmail,
          updated_at: data.user?.updated_at ?? null,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[settings/update-email] error:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}

