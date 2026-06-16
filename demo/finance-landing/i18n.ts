import { getRequestConfig } from "next-intl/server";

export const locales = ["vi", "en"] as const;
export const defaultLocale = "vi";

export default getRequestConfig(async ({ requestLocale }) => {
  // API mới (next-intl 3.22+): requestLocale là Promise, và phải trả về locale.
  const requested = await requestLocale;
  const locale = locales.includes(requested as (typeof locales)[number])
    ? (requested as string)
    : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
