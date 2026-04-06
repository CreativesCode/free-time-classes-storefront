import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  ExternalLink,
  LifeBuoy,
  MessageCircle,
  MonitorSmartphone,
  Search,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { buildPageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return buildPageMetadata({
    locale,
    path: "/contact",
    title: t("contact.title"),
    description: t("contact.description"),
  });
}

const helpCategories = [
  {
    title: "Aprendizaje y clases",
    description:
      "Acceso a cursos, sesiones en vivo, certificados y seguimiento de progreso.",
    meta: "12 artículos",
    icon: BookOpen,
    iconWrapClassName: "bg-primary/10 text-primary",
    className:
      "col-span-2 rounded-3xl border border-primary/10 bg-surface-container-low p-6 md:col-span-8 md:min-h-[280px] md:p-10",
  },
  {
    title: "Facturación y planes",
    description: "Suscripciones, cobros, facturas y políticas de reembolso.",
    meta: "8 artículos",
    icon: CreditCard,
    iconWrapClassName: "bg-white/20 text-primary-foreground",
    className:
      "rounded-3xl bg-primary p-6 text-primary-foreground md:col-span-4 md:p-10",
  },
  {
    title: "Cuenta",
    description: "Perfil, seguridad y preferencias.",
    meta: "15 artículos",
    icon: Settings2,
    iconWrapClassName: "bg-primary/10 text-primary",
    className:
      "rounded-3xl bg-surface-container-highest p-6 md:col-span-4 md:p-10",
  },
  {
    title: "Privacidad",
    description: "Protección de datos y uso responsable de la plataforma.",
    meta: "6 artículos",
    icon: ShieldCheck,
    iconWrapClassName: "bg-primary/10 text-primary",
    className:
      "rounded-3xl border border-border/60 bg-card p-6 md:col-span-4 md:p-10",
  },
  {
    title: "Soporte técnico",
    description: "Problemas de reproducción, app móvil y compatibilidad.",
    meta: "10 artículos",
    icon: MonitorSmartphone,
    iconWrapClassName: "bg-primary/10 text-primary",
    className:
      "rounded-3xl bg-surface-container-high p-6 md:col-span-4 md:p-10",
  },
];

const faqItems = [
  {
    category: "Pagos",
    question: "¿Cómo solicito un reembolso?",
    answer:
      "Puedes pedirlo desde tu historial de pagos dentro del periodo permitido según la política del curso.",
  },
  {
    category: "Clases",
    question: "¿Puedo cambiar de tutor durante un curso?",
    answer:
      "Sí. Si necesitas cambiar de tutor, contacta soporte para revisar disponibilidad y alternativas.",
  },
  {
    category: "Técnico",
    question: "¿Hay opción offline en móvil?",
    answer:
      "Sí, en algunos contenidos puedes descargar materiales para estudiarlos sin conexión.",
  },
  {
    category: "Cuenta",
    question: "¿Cómo cambio mi correo o contraseña?",
    answer:
      "Desde Configuración puedes actualizar tus datos personales y reforzar la seguridad de tu cuenta.",
  },
];

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 md:pb-20 md:pt-12 lg:px-8 lg:pt-16">
      <section className="mb-10 md:mb-14 lg:mb-20">
        <div className="max-w-4xl">
          <p className="mb-3 inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
            Centro de ayuda
          </p>
          <h1 className="text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl md:hidden">
            ¿Cómo te ayudamos hoy?
          </h1>
          <h1 className="hidden text-balance text-5xl font-black tracking-tight text-foreground md:block lg:hidden">
            ¿Cómo podemos
            <span className="text-primary"> guiarte</span> hoy?
          </h1>
          <h1 className="hidden text-balance text-6xl font-black tracking-tight text-foreground lg:block">
            ¿Cómo podemos ayudarte hoy?
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-muted-foreground md:text-base lg:text-lg">
            Busca en nuestra base de conocimiento o explora categorías para
            resolver dudas sobre clases, pagos y tu cuenta.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:mt-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/70" />
            <input
              type="text"
              placeholder="Buscar artículos, guías o soluciones..."
              className="h-14 w-full rounded-2xl border border-border/60 bg-background pl-12 pr-4 text-sm shadow-sm outline-none ring-primary/20 transition focus:ring-2 md:h-16 md:text-base"
            />
          </div>
          <button className="hidden h-12 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 md:inline-flex md:items-center md:justify-center">
            Buscar
          </button>
        </div>
      </section>

      <section className="mb-12 grid grid-cols-2 gap-4 md:mb-16 md:grid-cols-12 md:gap-6 lg:mb-20">
        {helpCategories.map((category) => {
          const Icon = category.icon;

          return (
            <article
              key={category.title}
              className={`${category.className} group flex flex-col justify-between`}
            >
              <div className="space-y-4">
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full md:h-12 md:w-12 ${category.iconWrapClassName}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold tracking-tight md:text-2xl">
                  {category.title}
                </h2>
                <p className="text-sm opacity-90 md:text-base">
                  {category.description}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2 md:mt-8">
                <span className="rounded-full bg-background/60 px-3 py-1 text-xs font-semibold md:text-sm">
                  {category.meta}
                </span>
                <div className="inline-flex items-center gap-2 text-sm font-semibold">
                  Ver artículos
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mb-12 md:mb-16">
        <div className="mb-6 flex items-center justify-between md:mb-8">
          <h2 className="text-2xl font-black tracking-tight md:text-4xl">
            Preguntas frecuentes
          </h2>
          <Link
            href={`/${locale}/contact`}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Ver todo
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-5">
          {faqItems.map((faq) => (
            <article
              key={faq.question}
              className="rounded-2xl border border-border/50 bg-card p-5 md:p-7"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary/80">
                {faq.category}
              </p>
              <h3 className="mt-2 text-lg font-bold tracking-tight md:text-xl">
                {faq.question}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground md:p-10 lg:p-14">
        <div className="pointer-events-none absolute -right-14 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight md:text-4xl">
              ¿Sigues necesitando ayuda?
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-primary-foreground/85 md:text-base">
              Nuestro equipo de soporte está disponible para ayudarte con
              cualquier incidencia de forma rápida.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
            <a
              href="mailto:info@freetimeclasses.com"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-bold text-primary transition hover:bg-background/90"
            >
              <MessageCircle className="h-4 w-4" />
              Contactar soporte
            </a>
            <a
              href="tel:+34123456789"
              className="inline-flex items-center justify-center rounded-full border border-primary-foreground/30 px-6 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary-foreground/10"
            >
              Llamar ahora
            </a>
            <Link
              href={`/${locale}/messages`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-primary-foreground/30 px-6 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary-foreground/10 md:hidden"
            >
              Abrir chat
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-border/50 bg-card p-5 md:mt-12 md:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
              Soporte editorial
            </p>
            <h3 className="mt-1 text-xl font-bold tracking-tight md:text-2xl">
              Canales de atención rápida
            </h3>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              También puedes abrir un ticket y hacer seguimiento desde tu panel.
            </p>
          </div>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold transition hover:bg-muted"
          >
            <LifeBuoy className="mr-2 h-4 w-4" />
            Ir al panel de soporte
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:mt-10 md:grid-cols-2">
        <article className="rounded-3xl bg-surface-container-low p-5 md:p-7">
          <h3 className="text-lg font-bold tracking-tight md:text-xl">
            Estado de ticket
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Si ya abriste un caso, consulta su estado en tiempo real desde tu
            panel.
          </p>
          <Link
            href={`/${locale}/settings`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            Revisar tickets
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>

        <article className="rounded-3xl border border-primary/15 bg-primary/5 p-5 md:p-7">
          <h3 className="text-lg font-bold tracking-tight md:text-xl">
            Soporte para tutores
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Ayuda dedicada para publicación de cursos, disponibilidad y pagos
            de tutor.
          </p>
          <Link
            href={`/${locale}/tutor/dashboard`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            Ir al panel tutor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      </section>
    </main>
  );
}
