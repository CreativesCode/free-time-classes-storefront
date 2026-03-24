import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, saveGoogleTokens } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      return NextResponse.redirect(
        new URL(`/settings?tab=account&google=error&reason=${errorParam}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/settings?tab=account&google=error&reason=missing_params", request.url)
      );
    }

    const userId = state;
    const tokens = await exchangeCodeForTokens(code);
    await saveGoogleTokens(userId, tokens);

    return NextResponse.redirect(
      new URL("/settings?tab=account&google=success", request.url)
    );
  } catch (err) {
    console.error("[google/callback] error:", err);
    return NextResponse.redirect(
      new URL("/settings?tab=account&google=error&reason=token_exchange", request.url)
    );
  }
}
