import type { Metadata } from "next"
import { SEO_CONFIG } from "@/config/seo"

/** OpenGraph object kind for a page's share card. */
export type ShareType = "website" | "article" | "profile"

/** Input for {@link buildPageMetadata}. */
export interface BuildPageMetadataInput {
    /** Page title (the root layout template appends "| StarCi Academy"). Omit to use the site name. */
    title?: string
    /** Meta description; falls back to the site default. */
    description?: string
    /** Path AFTER the locale segment, e.g. "/courses/fullstack-mastery", "/home", "" for the root. */
    path: string
    /** Active locale. */
    locale: string
    /** Explicit OG/Twitter image url(s); falls back to the branded default. */
    images?: string[]
    /** OpenGraph object type. */
    type?: ShareType
    /** When true, ask crawlers not to index (private / auth-gated pages). */
    noindex?: boolean
}

/** OG locale tag from the app locale code. */
const ogLocale = (locale: string): string => (locale === "vi" ? "vi_VN" : "en_US")

/**
 * Single source of per-page metadata: canonical + vi/en hreflang alternates +
 * OpenGraph + Twitter, composed from {@link SEO_CONFIG}. Every public page's
 * `generateMetadata` should build on this instead of hand-rolling the fields, so
 * canonical/hreflang/share tags stay consistent across the site.
 *
 * @param input - {@link BuildPageMetadataInput}
 */
export const buildPageMetadata = ({
    title,
    description,
    path,
    locale,
    images,
    type = "website",
    noindex,
}: BuildPageMetadataInput): Metadata => {
    const desc = description ?? SEO_CONFIG.defaultDescription
    const url = `${SEO_CONFIG.siteUrl}/${locale}${path}`
    const languages = Object.fromEntries(
        SEO_CONFIG.locales.map((l): [string, string] => [l, `${SEO_CONFIG.siteUrl}/${l}${path}`]),
    )
    const shareImages = (images?.length ? images : [SEO_CONFIG.ogImage]).map((src) => ({ url: src }))
    return {
        ...(title ? { title } : {}),
        description: desc,
        alternates: {
            canonical: url,
            languages: {
                ...languages,
                "x-default": `${SEO_CONFIG.siteUrl}/${SEO_CONFIG.defaultLocale}${path}`,
            },
        },
        // common share fields are valid for every ShareType; assert to sidestep the
        // discriminated-union friction of a dynamic `type`
        openGraph: {
            type,
            url,
            title: title ?? SEO_CONFIG.siteName,
            description: desc,
            siteName: SEO_CONFIG.siteName,
            locale: ogLocale(locale),
            images: shareImages,
        } as Metadata["openGraph"],
        twitter: {
            card: "summary_large_image",
            title: title ?? SEO_CONFIG.siteName,
            description: desc,
            images: shareImages.map((image) => image.url),
        },
        ...(noindex ? { robots: { index: false, follow: false } } : {}),
    }
}
