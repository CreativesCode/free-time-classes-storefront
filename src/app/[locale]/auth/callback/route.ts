import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectNext } from "@/lib/auth/safeRedirect";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type") as EmailOtpType | null;
  const next = getSafeRedirectNext(locale, searchParams.get("next"));
  const errorFromUrl =
    searchParams.get("error_description") || searchParams.get("error");

  const redirectBase = `${req.nextUrl.origin}/${locale}/auth/callback/result`;
  const resultRedirect = (query: Record<string, string>) => {
    const url = new URL(redirectBase);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
    return NextResponse.redirect(url);
  };

  // Forward any OAuth/email errors straight to the result page
  if (errorFromUrl) {
    return resultRedirect({ error: errorFromUrl });
  }

  const supabase = await createClient();

  // Email templates using `{{ .TokenHash }}` work from any browser or device
  // (no PKCE verifier needed).
  if (tokenHash && otpType && EMAIL_OTP_TYPES.includes(otpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    if (error) return resultRedirect({ error: error.message });
    if (otpType === "recovery") {
      return NextResponse.redirect(
        new URL(`/${locale}/auth/reset-password`, req.nextUrl.origin)
      );
    }
    if (next) return NextResponse.redirect(new URL(next, req.nextUrl.origin));
    return resultRedirect({ success: "true" });
  }

  if (!code) {
    return resultRedirect({ error: "missing_code" });
  }

  // Exchange the code server-side where cookies (PKCE verifier) are accessible
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // The link was opened in another browser/device than the one that started
    // the flow. For a signup Supabase has already confirmed the email, so the
    // user only needs to sign in; a password reset must be restarted here.
    if (error.code === "pkce_code_verifier_not_found") {
      return resultRedirect({
        error: next?.endsWith("/auth/reset-password")
          ? "recovery_other_device"
          : "confirmed_other_device",
      });
    }
    return resultRedirect({ error: error.message });
  }

  if (next) return NextResponse.redirect(new URL(next, req.nextUrl.origin));
  return resultRedirect({ success: "true" });
}
