import { Suspense } from "react";

import AuthCallbackClient from "./AuthCallbackClient";

export default async function AuthCallbackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <Suspense fallback={null}>
      <AuthCallbackClient locale={locale} />
    </Suspense>
  );
}
