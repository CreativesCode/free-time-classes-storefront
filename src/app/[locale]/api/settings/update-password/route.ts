import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  password: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<Body>;
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (password.length < 6) {
      return NextResponse.json({ error: "Invalid password." }, { status: 400 });
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
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to update password." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: data.user?.id ?? user.id,
          updated_at: data.user?.updated_at ?? null,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[settings/update-password] error:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}

