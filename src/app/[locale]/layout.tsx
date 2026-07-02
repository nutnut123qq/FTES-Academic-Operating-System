import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import type { Metadata } from "next"
import { AnalyticsGate } from "@/components/features/cookie-consent/AnalyticsGate"
import { InnerLayout } from "../InnerLayout"
import React, { PropsWithChildren } from "react"
import { Open_Sans } from "next/font/google"
import { SEO_CONFIG } from "@/config/seo"
import { ACCENT_PRESETS, APPEARANCE_STORAGE_KEY } from "@/resources/constants/appearance"

const font = Open_Sans({
    subsets: ["latin"],
    variable: "--font-open-sans",
})

/**
 * Pre-paint accent script (appearance-settings) — same strategy next-themes uses
 * for the `dark` class: read the persisted zustand state from localStorage and set
 * `data-accent` on `<html>` BEFORE first paint so the stored accent never flashes
 * the default. Swallows every error (private mode / garbage JSON) → falls back to
 * the default accent baked into the theme tokens.
 */
const accentPrePaintScript = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(APPEARANCE_STORAGE_KEY)});if(!raw)return;var accent=JSON.parse(raw).state.accent;if(${JSON.stringify(ACCENT_PRESETS.map((preset) => preset.id))}.indexOf(accent)>=0){document.documentElement.setAttribute("data-accent",accent)}}catch(e){}})()`

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
                {/* pre-paint accent: must run before any content renders (no flash) */}
                <script dangerouslySetInnerHTML={{ __html: accentPrePaintScript }} />
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
