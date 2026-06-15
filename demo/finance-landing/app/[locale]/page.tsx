import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LeadForm, type LeadFormLabels } from "@/components/LeadForm";
import { issueFormToken } from "@/lib/formToken";

const OPTION_VALUES = [
  "under_100m",
  "100m_500m",
  "500m_1b",
  "over_1b",
] as const;

export default async function Home({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  const labels: LeadFormLabels = {
    name: t("form.name"),
    email: t("form.email"),
    phone: t("form.phone"),
    investmentRange: t("form.investmentRange"),
    investmentOptions: OPTION_VALUES.map((value) => ({
      value,
      label: t(`form.options.${value}`),
    })),
    consent: t("form.consent"),
    submit: t("form.submit"),
    submitting: t("form.submitting"),
    successMessage: t("form.successMessage"),
    errorMessage: t("form.errorMessage"),
  };

  return (
    <main className="mx-auto max-w-2xl p-8">
      <nav className="mb-6 flex justify-end gap-3 text-sm">
        <Link
          href="/vi"
          className={locale === "vi" ? "font-bold underline" : "text-blue-600"}
        >
          {t("lang.vi")}
        </Link>
        <Link
          href="/en"
          className={locale === "en" ? "font-bold underline" : "text-blue-600"}
        >
          {t("lang.en")}
        </Link>
      </nav>

      <h1 className="text-3xl font-bold">{t("hero.title")}</h1>
      <p className="mt-3 text-gray-600">{t("hero.subtitle")}</p>

      <section className="mt-8">
        <LeadForm labels={labels} formToken={issueFormToken()} />
      </section>

      <p className="mt-6 text-xs text-gray-500">{t("hero.disclaimer")}</p>
    </main>
  );
}
