import type { Metadata } from "next";
import { Amiri, Tajawal } from "next/font/google";
import Script from "next/script";

import { AppShell } from "@/components/layout/app-shell";
import { AppRuntime } from "@/components/shared/app-runtime";
import { AppProviders } from "@/lib/providers/app-providers";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_URL } from "@/lib/seo/metadata";

import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "700"]
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  variable: "--font-quran",
  weight: ["400", "700"]
});

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
const bingSiteVerification = process.env.BING_SITE_VERIFICATION?.trim();

const verificationMetadata: Metadata["verification"] | undefined =
  googleSiteVerification || bingSiteVerification
    ? {
        ...(googleSiteVerification ? { google: googleSiteVerification } : {}),
        ...(bingSiteVerification ? { other: { "msvalidate.01": bingSiteVerification } } : {})
      }
    : undefined;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Quranic Pomodoro | تركيز وقراءة وتفسير",
    template: "%s | Quranic Pomodoro"
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [...SITE_KEYWORDS],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    siteName: SITE_NAME,
    title: "Quranic Pomodoro | تركيز وقراءة وتفسير",
    description: SITE_DESCRIPTION,
    url: "/"
  },
  twitter: {
    card: "summary",
    title: "Quranic Pomodoro | تركيز وقراءة وتفسير",
    description: SITE_DESCRIPTION
  },
  verification: verificationMetadata,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1
    }
  }
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  inLanguage: "ar"
};

const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  inLanguage: "ar",
  url: SITE_URL,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD"
  }
};

const hydrationAttributeCleanupScript = `
  (function () {
    var shouldRemove = function (name) {
      return (
        name === 'bis_skin_checked' ||
        name === 'data--h-bstatus' ||
        name === 'data-new-gr-c-s-check-loaded' ||
        name === 'data-gr-ext-installed' ||
        name.indexOf('data--h-') === 0 ||
        name.indexOf('bis_') === 0 ||
        name.indexOf('__processed_') === 0
      );
    };

    var scrubNode = function (node) {
      if (!node || node.nodeType !== 1) return;

      Array.prototype.slice.call(node.attributes || []).forEach(function (attribute) {
        if (shouldRemove(attribute.name)) {
          node.removeAttribute(attribute.name);
        }
      });

      Array.prototype.slice.call(node.children || []).forEach(scrubNode);
    };

    scrubNode(document.documentElement);

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName && shouldRemove(mutation.attributeName)) {
          mutation.target.removeAttribute(mutation.attributeName);
        }

        Array.prototype.slice.call(mutation.addedNodes || []).forEach(scrubNode);
      });
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true
    });

    window.setTimeout(function () {
      observer.disconnect();
    }, 4000);
  })();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${tajawal.variable} ${amiri.variable}`} data-theme="mint">
        <Script id="seo-website-schema" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(websiteSchema)}
        </Script>
        <Script id="seo-webapp-schema" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify(webApplicationSchema)}
        </Script>
        <Script id="hydration-attribute-cleanup" strategy="beforeInteractive">
          {hydrationAttributeCleanupScript}
        </Script>
        <AppProviders>
          <AppRuntime />
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
