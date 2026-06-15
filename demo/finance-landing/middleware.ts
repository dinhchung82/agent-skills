import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n";

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
});

export const config = {
  // Bỏ qua API, static, file có đuôi.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
