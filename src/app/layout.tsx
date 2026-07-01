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