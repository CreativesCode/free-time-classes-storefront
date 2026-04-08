import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const errorFromUrl =
    searchParams.get("error_description") || searchParams.get("error");

  const redirectBase = `${req.nextUrl.origin}/${locale}/auth/callback/result`;

  // Forward any OAuth/email errors straight to the result page
  if (errorFromUrl) {
    const url = new URL(redirectBase);
    url.searchParams.set("error", errorFromUrl);
    return NextResponse.redirect(url);
  }

  if (!code) {
    const url = new URL(redirectBase);
    url.searchParams.set("error", "missing_code");
    return NextResponse.redirect(url);
  }

  // Exchange the code server-side where cookies (PKCE verifier) are accessible
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  const url = new URL(redirectBase);
  if (error) {
    url.searchParams.set("error", error.message);
  } else {
    url.searchParams.set("success", "true");
  }

  return NextResponse.redirect(url);
}
