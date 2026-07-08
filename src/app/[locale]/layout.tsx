import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Playfair_Display, Amiri, Lora } from "next/font/google";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "ar")) {
    notFound();
  }

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${lora.variable} ${amiri.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://bfkjimqsznebqhtqwafo.supabase.co" />
        <link rel="preload" href="/shababik-solid-logo.png" as="image" fetchPriority="high" />
      </head>
      <body className="min-h-full flex flex-col w-full">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
