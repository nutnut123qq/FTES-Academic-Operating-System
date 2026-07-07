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
    },
    twitter: {
        card: "summary_large_image",
        title: SEO_CONFIG.siteName,
        description: SEO_CONFIG.defaultDescription,
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