"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Status = "success" | "error";

export default function AuthCallbackClient({ locale }: { locale: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const t = useTranslations("authCallback");

  const [redirectSeconds, setRedirectSeconds] = useState<number | null>(null);

  const errorMessage = useMemo(() => {
    const err = params.get("error");
    if (!err) return null;
    if (err === "missing_code") return t("missingCode");
    return decodeURIComponent(err);
  }, [params, t]);

  const status: Status = errorMessage ? "error" : "success";

  useEffect(() => {
    if (status !== "success") return;

    setRedirectSeconds(3);
    const interval = window.setInterval(() => {
      setRedirectSeconds((s) => (s === null ? s : Math.max(0, s - 1)));
    }, 1000);

    const timeout = window.setTimeout(() => {
      router.push(`/${locale}/login`);
    }, 3000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [status, router, locale]);

  const goToLogin = () => router.push(`/${locale}/login`);
  const goToDashboard = () => router.push(`/${locale}/dashboard`);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 bg-[url('/images/bg.webp')] bg-cover bg-center bg-no-repeat">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-secondary-500">
            {status === "success" ? t("successTitle") : t("errorTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <>
              <p className="text-center text-sm text-secondary-500">
                {t("successDescription")}
              </p>
              {redirectSeconds !== null && (
                <p className="text-center text-xs text-secondary-500">
                  {t("autoRedirect", { seconds: redirectSeconds })}
                </p>
              )}
              <div className="space-y-2">
                <Button className="w-full btn-primary" onClick={goToLogin}>
                  {t("goToLogin")}
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={goToDashboard}
                >
                  {t("goToDashboard")}
                </Button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <Alert variant="destructive">
                <AlertDescription>
                  {errorMessage || t("genericError")}
                </AlertDescription>
              </Alert>
              <Button className="w-full btn-primary" onClick={goToLogin}>
                {t("goToLogin")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
