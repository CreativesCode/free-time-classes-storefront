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
    <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 sm:px-6 md:pb-20 md:pt-12 lg:px-8 lg:pt-16">
      <header className="mb-8 md:mb-12">
        <p className="mb-3 inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
          Legal
        </p>
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Política de privacidad
        </h1>
        <p className="mt-4 text-sm text-muted-foreground md:text-base">
          Última actualización: 24 de marzo de 2026.
        </p>
      </header>

      <section className="space-y-8">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-2xl border border-border/60 bg-card p-5 md:p-7"
          >
            <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground md:text-base">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
