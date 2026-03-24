"use client";

import { useAuth } from "@/context/UserContext";
import { useTranslations, useLocale } from "@/i18n/translations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  CheckCircle,
  LinkIcon,
  Sparkles,
  Users
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

  const highlights = [
    {
      icon: BadgeCheck,
      title: t("benefit3Title"),
      description: t("benefit3Description"),
    },
    {
      icon: CircleDollarSign,
      title: t("benefit1Title"),
      description: t("benefit1Description"),
    },
  ];

  const steps = [
    { icon: BookOpen, title: t("step1Title"), description: t("step1Description") },
    { icon: Clock3, title: t("step2Title"), description: t("step2Description") },
    { icon: Users, title: t("step3Title"), description: t("step3Description") },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(80%_90%_at_10%_0%,hsl(var(--primary)/0.10),transparent_55%),radial-gradient(80%_90%_at_100%_20%,hsl(var(--primary)/0.08),transparent_60%)]">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-6 md:gap-10 md:px-8 md:pt-14 lg:flex-row lg:gap-14 lg:px-10 lg:pt-20">
        <section className="w-full lg:sticky lg:top-24 lg:h-fit lg:w-5/12">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Expert onboarding
          </div>
          <h1 className="mt-5 text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
            {t("subtitle")}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-border/50 bg-background/75 p-4 backdrop-blur-sm"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </article>
            ))}
          </div>

          {/* Mobile: compact horizontal steps */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 md:hidden">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex min-w-[140px] flex-1 flex-col items-center gap-2 rounded-xl border border-border/50 bg-background/65 p-3 text-center backdrop-blur-sm"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <step.icon className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold leading-tight">{step.title}</p>
              </div>
            ))}
          </div>

          {/* Tablet/Desktop: vertical steps */}
          <div className="mt-8 hidden gap-3 md:flex md:flex-col">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/65 p-3 backdrop-blur-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <step.icon className="h-4 w-4 text-primary" />
                    {step.title}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full lg:w-7/12">
          <div className="rounded-3xl border border-border/60 bg-background/95 p-5 shadow-[0_24px_80px_rgba(112,42,225,0.10)] backdrop-blur-sm sm:p-8 md:p-10">
            <form className="space-y-7">
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                    Perfil profesional
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Cuéntanos sobre tu área de especialización.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField
                    icon={BookOpen}
                    label="Materia principal"
                    placeholder="Ej. Dirección creativa"
                  />
                  <InputField
                    icon={BriefcaseBusiness}
                    label="Experiencia"
                    placeholder="Selecciona experiencia"
                  />
                </div>
                <InputField
                  icon={LinkIcon}
                  label="Portfolio URL"
                  placeholder="https://tuportfolio.com"
                />
              </div>

              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                    Tarifas por sesión
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Configura tu precio estándar por hora.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr]">
                  <InputField
                    icon={CircleDollarSign}
                    label="Tarifa por sesión (USD)"
                    placeholder="95.00 / hora"
                  />
                  <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/10 p-4 text-xs leading-relaxed text-primary/90">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                    Los tutores con tu nivel suelen cobrar entre $80 y $140 para
                    esta materia.
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground">
                <div className="flex items-start gap-3">
                  <input
                    className="mt-0.5 h-4 w-4 rounded border-primary/30 text-primary focus:ring-primary"
                    type="checkbox"
                    defaultChecked
                  />
                  <p>
                    Acepto los términos de servicio para tutores y confirmo que
                    cuento con las credenciales necesarias para impartir clases.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <HeroCta user={user} locale={locale} t={t} />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-12 rounded-full px-8"
                >
                  Guardar avance
                </Button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              {user ? "¿Quieres revisar tus datos?" : "¿Ya tienes cuenta?"}{" "}
              <Link
                href={user ? `/${locale}/settings` : `/${locale}/login`}
                className="font-semibold text-primary hover:underline"
              >
                {user ? "Ir a configuración" : "Inicia sesión"}
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function InputField({
  icon: Icon,
  label,
  placeholder,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  placeholder: string;
}) {
  return (
    <label className="space-y-2">
      <span className="block pl-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input
          readOnly
          value=""
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-transparent bg-muted/60 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/80 focus:border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </label>
  );
}

function HeroCta({
  user,
  locale,
  t,
}: {
  user: ReturnType<typeof useAuth>["user"];
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  if (user) {
    return (
      <Button asChild className="h-12 flex-1 rounded-full px-8">
        <Link href={`/${locale}/settings`}>
          {t("upgradeAccount")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild className="h-12 flex-1 rounded-full px-8">
      <Link href={`/${locale}/register`}>
        {t("registerNow")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  );
}
