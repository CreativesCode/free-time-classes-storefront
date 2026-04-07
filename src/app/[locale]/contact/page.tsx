import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight, MessageCircle } from "lucide-react";

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

const faqItems = [
  {
    category: "Contacto",
    question: "¿Cómo puedo resolver una duda sobre pagos o clases?",
    answer:
      "Escríbenos a info@freetimeclasses.com y te responderemos lo antes posible.",
  },
  {
    category: "Clases",
    question: "¿Puedo cambiar de tutor durante un curso?",
    answer:
      "Depende del curso y la disponibilidad. Escríbenos y revisamos tu caso.",
  },
  {
    category: "Cuenta",
    question: "¿Cómo cambio mi correo o contraseña?",
    answer:
      "Desde Configuración puedes actualizar tus datos personales y la seguridad de tu cuenta.",
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
      <section className="mb-10 md:mb-14 lg:mb-16">
        <div className="max-w-4xl">
          <p className="mb-3 inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
            Contacto
          </p>
          <h1 className="text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl md:hidden">
            ¿Cómo te ayudamos hoy?
          </h1>
          <h1 className="hidden text-balance text-5xl font-black tracking-tight text-foreground md:block lg:hidden">
            ¿Cómo podemos
            <span className="text-primary"> ayudarte</span> hoy?
          </h1>
          <h1 className="hidden text-balance text-6xl font-black tracking-tight text-foreground lg:block">
            ¿Cómo podemos ayudarte hoy?
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-muted-foreground md:text-base lg:text-lg">
            Consulta las preguntas frecuentes o escríbenos por correo o desde los
            mensajes de la plataforma.
          </p>
        </div>
      </section>

      <section className="mb-12 md:mb-16">
        <h2 className="mb-6 text-2xl font-black tracking-tight md:mb-8 md:text-4xl">
          Preguntas frecuentes
        </h2>

        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          {faqItems.map((faq) => (
            <article
              key={faq.question}
              className="rounded-md border border-border/50 bg-card p-5 md:p-6"
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

      <section className="relative overflow-hidden rounded-xl bg-primary p-6 text-primary-foreground md:p-10 lg:p-12">
        <div className="pointer-events-none absolute -right-14 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight md:text-4xl">
              ¿Sigues necesitando ayuda?
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-primary-foreground/85 md:text-base">
              Escríbenos por correo o abre una conversación con tu tutor u otros
              usuarios desde Mensajes.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
            <a
              href="mailto:info@freetimeclasses.com"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-bold text-primary transition hover:bg-background/90"
            >
              <MessageCircle className="h-4 w-4" />
              Escribir por correo
            </a>
            <Link
              href={`/${locale}/messages`}
              className="inline-flex items-center justify-center rounded-full border border-primary-foreground/30 px-6 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary-foreground/10"
            >
              Ir a mensajes
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8 md:mt-10">
        <article className="rounded-xl border border-primary/15 bg-primary/5 p-5 md:p-7">
          <h3 className="text-lg font-bold tracking-tight md:text-xl">
            Eres tutor
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Gestiona tus cursos, disponibilidad y perfil desde el panel de tutor.
          </p>
          <Link
            href={`/${locale}/tutor/dashboard`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            Ir al panel de tutor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </article>
      </section>
    </main>
  );
}
