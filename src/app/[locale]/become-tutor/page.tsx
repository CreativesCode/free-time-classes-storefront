import { getLocale, getTranslations } from "next-intl/server";
import BecomeTutorClient, {
  type BecomeTutorCopy,
} from "./BecomeTutorClient";

export default async function BecomeTutorPage() {
  const t = await getTranslations("becomeTutor");
  const locale = await getLocale();

  const copy: BecomeTutorCopy = {
    title: t("title"),
    subtitle: t("subtitle"),
    alreadyTutor: t("alreadyTutor"),
    goToProfile: t("goToProfile"),
    benefit3Title: t("benefit3Title"),
    benefit3Description: t("benefit3Description"),
    benefit1Title: t("benefit1Title"),
    benefit1Description: t("benefit1Description"),
    step1Title: t("step1Title"),
    step1Description: t("step1Description"),
    step2Title: t("step2Title"),
    step2Description: t("step2Description"),
    step3Title: t("step3Title"),
    step3Description: t("step3Description"),
    upgradeAccount: t("upgradeAccount"),
    registerNow: t("registerNow"),
  };

  return <BecomeTutorClient locale={locale} copy={copy} />;
}
