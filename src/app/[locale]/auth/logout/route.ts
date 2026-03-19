import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { locale: string } }
) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const redirectUrl = new URL(`/${params.locale}/`, request.url);
  return NextResponse.redirect(redirectUrl);
}
