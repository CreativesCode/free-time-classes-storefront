import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ locale: string }> }
) {
  const { locale } = await context.params;
  const supabase = await createClient();
  await supabase.auth.signOut();

  const redirectUrl = new URL(`/${locale}/`, request.url);
  return NextResponse.redirect(redirectUrl);
}
