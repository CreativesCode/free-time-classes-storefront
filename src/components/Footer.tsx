"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const t = useTranslations("home");
  const locale = useLocale();
  const year = new Date().getFullYear();

  const quickLinks = [
    { href: `/${locale}/tutors`, label: t("findTutors") },
    { href: `/${locale}/courses`, label: t("availableCourses") },
    { href: `/${locale}/become-tutor`, label: t("becomeTutor") },
    { href: `/${locale}/about`, label: t("aboutUs") },
    { href: `/${locale}/privacy-policy`, label: "Política de privacidad" },
    { href: `/${locale}/terms-of-service`, label: "Términos de servicio" },
  ];

  const socialLinks = [
    { href: "https://facebook.com", icon: "/images/icons/facebook.svg", alt: "Facebook" },
    { href: "https://instagram.com", icon: "/images/icons/instagram.svg", alt: "Instagram" },
    { href: "https://twitter.com", icon: "/images/icons/x.svg", alt: "Twitter" },
    { href: "https://youtube.com", icon: "/images/icons/youtube.svg", alt: "Youtube" },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#09090f] pb-20 pt-10 text-white md:pb-0 md:pt-12">
      <div className="pointer-events-none absolute inset-x-0 -top-32 h-72 bg-[radial-gradient(circle_at_30%_30%,rgba(124,58,237,0.28),transparent_58%)]" />
      <div className="pointer-events-none absolute -bottom-36 right-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(244,114,182,0.16),transparent_70%)] blur-2xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-lumina-sm backdrop-blur-lumina">
            <p className="text-lumina-overline font-bold uppercase tracking-overline text-white/65">
              FreeTime Lumina
            </p>
            <h3 className="mt-3 text-lumina-h3 font-semibold text-white">Free Time Classes</h3>
            <p className="mt-3 text-lumina-body text-white/70">{t("companyDescription")}</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
            <h4 className="text-lumina-body-lg font-semibold text-white">{t("quickLinks")}</h4>
            <ul className="mt-4 space-y-3">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-lumina-body text-white/70 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
            <h4 className="text-lumina-body-lg font-semibold text-white">{t("contact")}</h4>
            <ul className="mt-4 space-y-3 text-lumina-body text-white/70">
              <li>{t("email")}</li>
              <li>{t("phone")}</li>
              <li>{t("address")}</li>
              <li>{t("schedule")}</li>
            </ul>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
            <h4 className="text-lumina-body-lg font-semibold text-white">{t("followUs")}</h4>
            <div className="mt-4 flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.alt}
                  href={social.href}
                  aria-label={social.alt}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] transition-all hover:border-white/35 hover:bg-white/[0.14]"
                >
                  <Image
                    src={social.icon}
                    alt={social.alt}
                    className="h-5 w-5"
                    width={20}
                    height={20}
                    sizes="20px"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 py-6 text-center md:mt-10 md:flex md:items-center md:justify-between md:text-left">
          <p className="text-lumina-body-sm text-white/65">
            &copy; {year} Free Time Classes. {t("allRightsReserved")}
          </p>
          <div className="mt-3 flex items-center justify-center gap-5 md:mt-0 md:justify-end">
            <Link href={`/${locale}/contact`} className="text-lumina-body-sm text-white/65 transition-colors hover:text-white">
              {t("contact")}
            </Link>
            <Link href={`/${locale}/about`} className="text-lumina-body-sm text-white/65 transition-colors hover:text-white">
              {t("aboutUs")}
            </Link>
            <Link
              href={`/${locale}/privacy-policy`}
              className="text-lumina-body-sm text-white/65 transition-colors hover:text-white"
            >
              Privacidad
            </Link>
            <Link
              href={`/${locale}/terms-of-service`}
              className="text-lumina-body-sm text-white/65 transition-colors hover:text-white"
            >
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
