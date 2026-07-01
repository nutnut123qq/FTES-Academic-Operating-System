import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import type { Metadata } from "next"
import { AnalyticsGate } from "@/components/features/cookie-consent/AnalyticsGate"
import { InnerLayout } from "../InnerLayout"
import React, { PropsWithChildren } from "react"
import { Open_Sans } from "next/font/google"
import { SEO_CONFIG } from "@/config/seo"

const font = Open_Sans({
    subsets: ["latin"],
    variable: "--font-open-sans",
})

/** Route params for the `[locale]` segment. */
interface LocaleRouteParams {
    /** Active locale code resolved from the URL (e.g. `vi`, `en`). */
    locale: string
}

/** Props for the locale root layout: page subtree plus the awaited route params. */
interface LocaleLayoutProps extends PropsWithChildren {
    /** Promise of the resolved `[locale]` route params (Next.js App Router). */
    params: Promise<LocaleRouteParams>
}

/**
 * Locale-level metadata: sets the OpenGraph locale so inherited (non-builder)
 * pages still unfurl with the right `og:locale`. Per-page `generateMetadata`
 * (via `buildPageMetadata`) overrides canonical/hreflang/title as needed.
 *
 * @param props.params - the awaited `[locale]` route params.
 */
export const generateMetadata = async ({
    params,
}: {
    params: Promise<LocaleRouteParams>
}): Promise<Metadata> => {
    const { locale } = await params
    return {
        openGraph: {
            locale: locale === "vi" ? "vi_VN" : "en_US",
        },
    }
}

const Layout = async ({
    children,
    params,
}: LocaleLayoutProps) => {
    const { locale } = await params
    const messages = await getMessages()
    return (
        <html lang={locale}>
            <body className={`${font.className} ${font.variable} antialiased  bg-background`}>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <InnerLayout>
                        <div>
                            {children}
                        </div>
                    </InnerLayout>
                </NextIntlClientProvider>
                {/* GA4 — injected only when a measurement id is configured AND the visitor has
                    consented to analytics (AnalyticsGate gates on cookie consent) */}
                {SEO_CONFIG.gaId ? <AnalyticsGate gaId={SEO_CONFIG.gaId} /> : null}
            </body>
        </html>
    )
}
export default Layout
