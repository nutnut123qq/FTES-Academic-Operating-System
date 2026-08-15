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
 * the default. A free-form `accentCustom` colour additionally goes on as an inline
 * `--accent` / `--accent-foreground` pair (inline styles outrank the `[data-accent]`
 * blocks) — the YIQ branch here MUST stay in sync with `accentForeground()` in
 * `resources/constants/appearance.ts`. Swallows every error (private mode /
 * garbage JSON) → falls back to the default accent baked into the theme tokens.
 */
const accentPrePaintScript = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(APPEARANCE_STORAGE_KEY)});if(!raw)return;var s=JSON.parse(raw).state;var e=document.documentElement;if(${JSON.stringify(ACCENT_PRESETS.map((preset) => preset.id))}.indexOf(s.accent)>=0){e.setAttribute("data-accent",s.accent)}var c=s.accentCustom;if(typeof c==="string"&&/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c)){var h=c.slice(1);if(h.length===3){h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2]}var y=(parseInt(h.slice(0,2),16)*299+parseInt(h.slice(2,4),16)*587+parseInt(h.slice(4,6),16)*114)/1000;e.style.setProperty("--accent",c);e.style.setProperty("--accent-foreground",y>=150?"oklch(21.03% 0.0015 354.13)":"oklch(100% 0 0)")}}catch(e){}})()`

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
                {/* Linh vật trợ lý (MascotAssistant) nằm ở MỌI trang và là ảnh động ~420KB —
                    preload để nó hiện ngay thay vì bật lên muộn ở góc màn hình. Chỉ preload
                    bản WebP: trình duyệt nào không đọc được animated WebP sẽ tự lấy GIF qua
                    <picture>, và preload thêm GIF thì mọi người đều tải thừa 1 file. */}
                <link rel="preload" as="image" href="/fes-mascot-wave.webp" type="image/webp" />
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
