import { Suspense } from "react";

import SettingsClient from "./SettingsClient";

function SettingsFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsClient locale={locale} />
    </Suspense>
  );
}
