import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";

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
    path: "/terms-of-service",
    title: t("termsOfService.title"),
    description: t("termsOfService.description"),
  });
}

const sections = [
  {
    title: "1. Aceptación de los términos",
    paragraphs: [
      "Al registrarte o usar Free Time Classes, aceptas estos términos de servicio y nuestras políticas publicadas en la plataforma.",
      "Si no estás de acuerdo con alguno de estos términos, debes abstenerte de utilizar el servicio.",
    ],
  },
  {
    title: "2. Uso de la plataforma",
    paragraphs: [
      "Te comprometes a usar la plataforma de forma lícita, respetuosa y conforme a la normativa aplicable.",
      "No está permitido publicar contenido fraudulento, ofensivo o que infrinja derechos de terceros.",
    ],
  },
  {
    title: "3. Cuentas y acceso",
    paragraphs: [
      "Eres responsable de mantener la confidencialidad de tus credenciales y de la actividad realizada desde tu cuenta.",
      "Podemos suspender o limitar cuentas que incumplan estos términos o representen un riesgo para la comunidad.",
    ],
  },
  {
    title: "4. Reservas, pagos y cancelaciones",
    paragraphs: [
      "Las condiciones de pago, reembolso y cancelación pueden variar según el tipo de clase o servicio contratado.",
      "Antes de confirmar una reserva, revisa los importes, fechas y políticas específicas aplicables.",
    ],
  },
  {
    title: "5. Propiedad intelectual",
    paragraphs: [
      "Los contenidos, marcas, diseño y materiales de la plataforma son propiedad de Free Time Classes o de sus respectivos titulares.",
      "No se autoriza su reproducción, distribución o uso comercial sin autorización previa.",
    ],
  },
  {
    title: "6. Limitación de responsabilidad",
    paragraphs: [
      "Hacemos esfuerzos razonables para mantener la disponibilidad y calidad del servicio, pero no garantizamos ausencia total de interrupciones.",
      "En la medida permitida por la ley, no seremos responsables por daños indirectos derivados del uso de la plataforma.",
    ],
  },
  {
    title: "7. Modificaciones",
    paragraphs: [
      "Podemos actualizar estos términos para adaptarlos a cambios legales, técnicos o del servicio.",
      "La versión vigente estará disponible en esta página e incluirá su fecha de actualización.",
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 pb-16 pt-10 md:px-9 md:pb-20 md:pt-14 lg:pt-20">
      <header className="mb-10 md:mb-14">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-ft-surface-2 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-ft-accent-deep">
          <ShieldCheck width={11} height={11} />
          Legal
        </p>
        <h1 className="m-0 text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-ft-ink md:text-[44px] lg:text-[52px]">
          Términos de servicio
        </h1>
        <p className="mt-4 text-[13px] text-ft-ink-3 md:text-[14px]">
          Última actualización: 24 de marzo de 2026.
        </p>
      </header>

      <section className="space-y-5 md:space-y-6">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-ft-lg border border-ft-line-soft bg-ft-paper p-5 md:p-7"
          >
            <h2 className="m-0 text-[18px] font-semibold tracking-tight text-ft-ink md:text-[20px]">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-ft-ink-2 md:text-[15px]">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="m-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
