"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export default function AboutPage() {
  const t = useTranslations("aboutUs");

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">{t("title")}</h1>

          <div className="space-y-8">
            <section className="prose max-w-none">
              <h2 className="text-2xl font-semibold mb-4">
                {t("mission.title")}
              </h2>
              <p className="text-gray-600">{t("mission.description")}</p>
            </section>

            <section className="prose max-w-none">
              <h2 className="text-2xl font-semibold mb-4">
                {t("vision.title")}
              </h2>
              <p className="text-gray-600">{t("vision.description")}</p>
            </section>

            <section className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">
                  {t("values.flexibility.title")}
                </h3>
                <p className="text-gray-600">
                  {t("values.flexibility.description")}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">
                  {t("values.community.title")}
                </h3>
                <p className="text-gray-600">
                  {t("values.community.description")}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">
                  {t("values.quality.title")}
                </h3>
                <p className="text-gray-600">
                  {t("values.quality.description")}
                </p>
              </div>
            </section>

            <section className="mt-12 bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t("joinUs.title")}
              </h2>
              <p className="text-gray-600 mb-6">{t("joinUs.description")}</p>
              <div className="flex justify-center">
                <Link
                  href="/register"
                  className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
                >
                  {t("joinUs.cta")}
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
