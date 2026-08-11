import type { Metadata } from "next"
import "./globals.css"
import { PropsWithChildren } from "react"
import { SEO_CONFIG } from "@/config/seo"

export const metadata: Metadata = {
    // absolute base so relative canonical / OG urls resolve to the real origin
    metadataBase: new URL(SEO_CONFIG.siteUrl),
    title: {
        default: SEO_CONFIG.siteName,
        template: `%s | ${SEO_CONFIG.siteName}`,
    },
    description: SEO_CONFIG.defaultDescription,
    applicationName: SEO_CONFIG.siteName,
    // Theme-aware browser-tab favicon: the light mark on light OS themes, the
    // dark-mobile mark on dark. Browsers pick by the `media` query natively.
    // (Overrides the file-convention app/icon.* — those are removed so the tab
    // isn't left showing the old StarCi "S".)
    icons: {
        icon: [
            { url: "/logo/LogoFtestMini.png", media: "(prefers-color-scheme: light)" },
            { url: "/logo/ftesMiniDarkMobile.png", media: "(prefers-color-scheme: dark)" },
        ],
        // `src/app/apple-icon.png` was the StarCI pink "S" (180²) and the app-dir
        // file convention outranks this config, so the file was deleted rather
        // than overridden. Stopgap: the FTES blue mark, which stays legible on
        // the black backplate iOS paints behind a transparent touch icon. It is
        // only 80² — a real 180², opaque-background export should replace it.
        apple: [{ url: "/logo/LogoFtestMini.png", sizes: "80x80" }],
    },
    alternates: {
        canonical: "/",
    },
    openGraph: {
        type: "website",
        siteName: SEO_CONFIG.siteName,
        title: SEO_CONFIG.siteName,
        description: SEO_CONFIG.defaultDescription,
        url: "/",
        // Without this the root share card had no image at all; localized pages
        // already get one via `buildPageMetadata`.
        images: [{ url: SEO_CONFIG.ogImage }],
    },
    twitter: {
        card: "summary_large_image",
        title: SEO_CONFIG.siteName,
        description: SEO_CONFIG.defaultDescription,
        images: [SEO_CONFIG.ogImage],
    },
    robots: {
        index: true,
        follow: true,
    },
    // Google Search Console verification — omitted when the token is not set
    verification: SEO_CONFIG.googleSiteVerification
        ? { google: SEO_CONFIG.googleSiteVerification }
        : undefined,
}

const Layout = ({ children }: PropsWithChildren) => {
    return children
}

export default Layout