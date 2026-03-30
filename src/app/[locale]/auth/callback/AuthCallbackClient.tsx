"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Status = "verifying" | "success" | "error";

export default function AuthCallbackClient({ locale }: { locale: string }) {
  const supabase = useMemo(() => createClient(), []);
  const params = useSearchParams();
  const router = useRouter();
  const t = useTranslations("authCallback");

  const [status, setStatus] = useState<Status>("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [redirectSeconds, setRedirectSeconds] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      const errorFromUrl =
        params.get("error_description") || params.get("error");
      if (errorFromUrl) {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage(decodeURIComponent(errorFromUrl));
        return;
      }

      const code = params.get("code");
      if (!code) {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage(t("missingCode"));
        return;
      }

      try {
        const exchangePromise = supabase.auth.exchangeCodeForSession(code);
        const timeoutPromise = new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("callback-timeout")), 12000);
        });

        const { error } = await Promise.race([exchangePromise, timeoutPromise]);
        if (error) {
          if (!isMounted) return;
          setStatus("error");
          setErrorMessage(error.message);
          return;
        }
      } catch (err) {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error && err.message === "callback-timeout"
            ? t("verificationTimeout")
            : err instanceof Error
              ? err.message
              : t("genericError")
        );
        return;
      }

      if (!isMounted) return;
      setStatus("success");
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [params, supabase, t]);

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
            {status === "verifying"
              ? t("verifyingTitle")
              : status === "success"
                ? t("successTitle")
                : t("errorTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "verifying" && (
            <>
              <p className="text-center text-sm text-secondary-500">
                {t("verifyingDescription")}
              </p>
              <Button className="w-full" variant="outline" onClick={goToLogin}>
                {t("goToLogin")}
              </Button>
            </>
          )}

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
