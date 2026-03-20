"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <footer className="bg-gray-900 text-white pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <h3 className="text-xl font-bold">Free Time Classes</h3>
            <p className="text-gray-400 text-sm">{t("companyDescription")}</p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">{t("quickLinks")}</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/tutors`}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t("findTutors")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/courses`}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t("availableCourses")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/become-tutor`}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t("becomeTutor")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/about`}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t("aboutUs")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">{t("contact")}</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>{t("email")}</li>
              <li>{t("phone")}</li>
              <li>{t("address")}</li>
              <li>{t("schedule")}</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">{t("followUs")}</h4>
            <div className="flex space-x-4">
              <Link
                href="https://facebook.com"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Image
                  src="/images/icons/facebook.svg"
                  alt="Facebook"
                  className="h-6 w-6"
                  width={24}
                  height={24}
                />
              </Link>
              <Link
                href="https://instagram.com"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Image
                  src="/images/icons/instagram.svg"
                  alt="Instagram"
                  className="h-6 w-6"
                  width={24}
                  height={24}
                />
              </Link>
              <Link
                href="https://twitter.com"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Image
                  src="/images/icons/x.svg"
                  alt="Twitter"
                  className="h-6 w-6"
                  width={24}
                  height={24}
                />
              </Link>
              <Link
                href="https://youtube.com"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Image
                  src="/images/icons/youtube.svg"
                  alt="Youtube"
                  className="h-6 w-6"
                  width={24}
                  height={24}
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
          <p>
            &copy; {new Date().getFullYear()} Free Time Classes.{" "}
            {t("allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}
