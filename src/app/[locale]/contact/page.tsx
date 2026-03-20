"use client";

import { useTranslations } from "@/i18n/translations";
import { Card } from "@/components/ui/card";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  const tFooter = useTranslations("footer");
  const tHome = useTranslations("home");

  // Nota: estos enlaces usan constantes de negocio; el texto visible vive en i18n.
  const businessEmail = "info@freetimeclasses.com";
  const businessPhone = "+34123456789";

  return (
    <div className="flex items-center justify-center min-h-screen py-10">
      <div className="w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{tFooter("contactUs")}</h1>
          <p className="mt-3 text-gray-600">
            {tHome("companyDescription")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div className="min-w-0">
                <a
                  href={`mailto:${businessEmail}`}
                  className="text-sm font-medium text-primary hover:underline mt-0.5 block"
                >
                  {tHome("email")}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-primary mt-0.5" />
              <div className="min-w-0">
                <a
                  href={`tel:${businessPhone}`}
                  className="text-sm font-medium text-primary hover:underline mt-0.5 block"
                >
                  {tHome("phone")}
                </a>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm text-gray-600">{tHome("address")}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm text-gray-600">{tHome("schedule")}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

