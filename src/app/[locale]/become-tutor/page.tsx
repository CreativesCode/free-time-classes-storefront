"use client";

import { useAuth } from "@/context/UserContext";
import { useTranslations, useLocale } from "@/i18n/translations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  GraduationCap,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  ArrowRight,
  Clock,
  Star,
  BookOpen,
  Shield,
} from "lucide-react";
import Link from "next/link";

export default function BecomeTutorPage() {
  const { user, isLoading } = useAuth();
  const t = useTranslations("becomeTutor");
  const locale = useLocale();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user?.is_tutor) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">{t("alreadyTutor")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/${locale}/teacher-profile`}>
                {t("goToProfile")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = [
    {
      icon: BookOpen,
      title: t("step1Title"),
      description: t("step1Description"),
    },
    {
      icon: Calendar,
      title: t("step2Title"),
      description: t("step2Description"),
    },
    {
      icon: Users,
      title: t("step3Title"),
      description: t("step3Description"),
    },
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: t("benefit1Title"),
      description: t("benefit1Description"),
    },
    {
      icon: Clock,
      title: t("benefit2Title"),
      description: t("benefit2Description"),
    },
    {
      icon: Star,
      title: t("benefit3Title"),
      description: t("benefit3Description"),
    },
    {
      icon: Shield,
      title: t("benefit4Title"),
      description: t("benefit4Description"),
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20 sm:py-28 lg:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="mx-auto max-w-screen-xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {t("subtitle")}
          </p>
          <div className="mt-10">
            <HeroCta user={user} locale={locale} t={t} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            {t("howItWorks")}
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg">
                  <span className="text-xl font-bold">{i + 1}</span>
                </div>
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">
                  {step.description}
                </p>
                {i < steps.length - 1 && (
                  <ArrowRight className="absolute -right-4 top-8 hidden h-6 w-6 text-muted-foreground/40 sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-muted/40 py-20 sm:py-24">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            {t("benefits")}
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {benefits.map((benefit, i) => (
              <Card
                key={i}
                className="border-0 bg-background shadow-md transition-shadow hover:shadow-lg"
              >
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {benefit.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-screen-xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-primary to-primary/80 px-8 py-14 text-primary-foreground shadow-xl sm:px-14">
            <h2 className="text-3xl font-bold sm:text-4xl">{t("cta")}</h2>
            <p className="mx-auto mt-4 max-w-lg opacity-90">
              {t("ctaSubtext")}
            </p>
            <div className="mt-8">
              <HeroCta user={user} locale={locale} t={t} variant="secondary" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroCta({
  user,
  locale,
  t,
  variant = "default",
}: {
  user: ReturnType<typeof useAuth>["user"];
  locale: string;
  t: ReturnType<typeof useTranslations>;
  variant?: "default" | "secondary";
}) {
  if (user) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Button size="lg" variant={variant} asChild>
          <Link href={`/${locale}/settings`}>
            {t("upgradeAccount")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <p className={`text-sm ${variant === "secondary" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          {t("upgradeDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button size="lg" variant={variant} asChild>
        <Link href={`/${locale}/register`}>
          {t("registerNow")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
      <p className={`text-sm ${variant === "secondary" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {t("loginRequired")}
      </p>
    </div>
  );
}
