import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  CreditCard,
  MessageCircle,
  Search,
  Settings2,
  ShieldCheck,
} from "lucide-react";

const helpCategories = [
  {
    title: "Primeros pasos",
    description:
      "Todo lo esencial para comenzar: registro, acceso a clases y navegación.",
    icon: BookOpen,
    className:
      "col-span-2 rounded-2xl bg-primary/10 p-6 md:col-span-8 md:p-10 lg:min-h-[260px]",
  },
  {
    title: "Pagos y planes",
    description: "Suscripciones, cobros, facturas y reembolsos.",
    icon: CreditCard,
    className:
      "rounded-2xl bg-primary text-primary-foreground p-6 md:col-span-4 md:p-10",
  },
  {
    title: "Cuenta",
    description: "Perfil, seguridad y preferencias.",
    icon: Settings2,
    className: "rounded-2xl bg-surface-container-highest p-6 md:col-span-4 md:p-10",
  },
  {
    title: "Privacidad",
    description: "Protección de datos y uso responsable de la plataforma.",
    icon: ShieldCheck,
    className: "rounded-2xl border border-border/60 bg-card p-6 md:col-span-4 md:p-10",
  },
  {
    title: "Soporte técnico",
    description: "Problemas de reproducción, app móvil y compatibilidad.",
    icon: CircleHelp,
    className:
      "rounded-2xl bg-surface-container-high p-6 md:col-span-4 md:p-10 lg:min-h-[220px]",
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
];

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 md:pt-14 lg:px-8 lg:pt-20">
      <section className="mb-10 md:mb-16 lg:mb-20">
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
            Centro de ayuda
          </p>
          <h1 className="text-balance text-4xl font-black tracking-tight text-foreground md:text-6xl">
            ¿Cómo podemos ayudarte hoy?
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base lg:text-lg">
            Busca en nuestra base de conocimiento o explora las categorías para
            resolver dudas sobre clases, pagos y tu cuenta.
          </p>
        </div>

        <div className="relative mt-6 md:mt-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/70" />
          <input
            type="text"
            placeholder="Buscar artículos, guías o soluciones..."
            className="h-14 w-full rounded-2xl border border-border/60 bg-background pl-12 pr-4 text-sm shadow-sm outline-none ring-primary/20 transition focus:ring-2 md:h-16 md:text-base"
          />
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
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-background/60 text-primary md:h-12 md:w-12">
                <Icon className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold tracking-tight md:text-2xl">
                  {category.title}
                </h2>
                <p className="mt-2 text-sm opacity-90 md:text-base">
                  {category.description}
                </p>
              </div>

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold md:mt-8">
                Ver artículos
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
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
            href="/"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Ver todo
          </Link>
        </div>

        <div className="space-y-4 md:space-y-5">
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

      <section className="rounded-3xl bg-primary p-6 text-primary-foreground md:p-10 lg:p-14">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight md:text-4xl">
              ¿Sigues necesitando ayuda?
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-primary-foreground/85 md:text-base">
              Nuestro equipo de soporte está disponible para ayudarte con cualquier
              incidencia de forma rápida.
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
          </div>
        </div>
      </section>
    </main>
  );
}

