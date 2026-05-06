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
    path: "/privacy-policy",
    title: t("privacyPolicy.title"),
    description: t("privacyPolicy.description"),
  });
}

const sections = [
  {
    title: "1. Información que recopilamos",
    paragraphs: [
      "Recopilamos datos que nos proporcionas al crear una cuenta, contratar clases o contactar soporte, como nombre, correo electrónico y datos de perfil.",
      "También recopilamos información técnica básica para operar la plataforma, como identificadores de sesión, dispositivo y métricas de uso.",
    ],
  },
  {
    title: "2. Uso de la información",
    paragraphs: [
      "Usamos tus datos para prestar el servicio, gestionar reservas, procesar pagos, mejorar la experiencia y enviarte comunicaciones relacionadas con tu cuenta.",
      "No utilizamos tus datos para finalidades incompatibles con la prestación del servicio sin informarte previamente.",
    ],
  },
  {
    title: "3. Compartición de datos",
    paragraphs: [
      "Podemos compartir datos con proveedores que nos ayudan a operar la plataforma, por ejemplo servicios de autenticación, infraestructura y pagos.",
      "Exigimos a dichos proveedores medidas adecuadas de seguridad y confidencialidad.",
    ],
  },
  {
    title: "4. Conservación y seguridad",
    paragraphs: [
      "Conservamos los datos durante el tiempo necesario para cumplir las finalidades descritas y obligaciones legales aplicables.",
      "Aplicamos medidas técnicas y organizativas razonables para proteger tu información frente a accesos no autorizados, pérdida o alteración.",
    ],
  },
  {
    title: "5. Tus derechos",
    paragraphs: [
      "Puedes solicitar acceso, rectificación, eliminación, limitación u oposición al tratamiento de tus datos, así como la portabilidad cuando corresponda.",
      "Para ejercer tus derechos, contáctanos en info@freetimeclasses.com.",
    ],
  },
  {
    title: "6. Cambios en esta política",
    paragraphs: [
      "Podemos actualizar esta política para reflejar cambios legales o funcionales de la plataforma.",
      "Publicaremos la versión vigente en esta página indicando la fecha de última actualización.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 pb-16 pt-10 md:px-9 md:pb-20 md:pt-14 lg:pt-20">
      <header className="mb-10 md:mb-14">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-ft-surface-2 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-ft-accent-deep">
          <ShieldCheck width={11} height={11} />
          Legal
        </p>
        <h1 className="m-0 text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-ft-ink md:text-[44px] lg:text-[52px]">
          Política de privacidad
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
