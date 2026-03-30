import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import MessagesClient from "./MessagesClient";

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return <MessagesClient />;
}
