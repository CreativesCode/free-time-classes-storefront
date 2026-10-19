import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";
import {
  exchangeCodeForTokens,
  GOOGLE_OAUTH_STATE_COOKIE,
  saveGoogleTokens,
} from "@/lib/google-calendar";

function resolveLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  return routing.locales.find((l) => l === cookieLocale) ?? routing.defaultLocale;
}

export async function GET(request: NextRequest) {
  const locale = resolveLocale(request);
  const redirectTo = (result: "success" | "error", reason?: string) => {
    const query = new URLSearchParams({ tab: "account", google: result });
    if (reason) query.set("reason", reason);
    const response = NextResponse.redirect(
      new URL(`/${locale}/settings?${query.toString()}`, request.url)
    );
    response.cookies.delete({ name: GOOGLE_OAUTH_STATE_COOKIE, path: "/api/google/callback" });
    return response;
  };

  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      return redirectTo("error", errorParam.slice(0, 64));
    }

    if (!code || !state) {
      return redirectTo("error", "missing_params");
    }

    const expectedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
    if (!expectedState || expectedState !== state) {
      return redirectTo("error", "invalid_state");
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return redirectTo("error", "unauthorized");
    }

    const { data: profile } = await supabase
      .from("users")
      .select("is_tutor")
      .eq("id", user.id)
      .single();

    if (!profile?.is_tutor) {
      return redirectTo("error", "forbidden");
    }

    const tokens = await exchangeCodeForTokens(code);
    await saveGoogleTokens(user.id, tokens);

    return redirectTo("success");
  } catch (err) {
    console.error("[google/callback] error:", err);
    return redirectTo("error", "token_exchange");
  }
}
