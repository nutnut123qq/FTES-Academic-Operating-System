import React, { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PublicArticle } from "@/components/features/content/PublicArticle"
import { SEO_CONFIG } from "@/config/seo"
import { queryPublicContent } from "@/modules/api/graphql/queries/query-public-content"

/** Route params for `/[locale]/contents/[contentId]`. */
interface ContentRouteParams {
    /** Active locale resolved from the URL. */
    locale: string
    /** Content displayId from the URL (matches the client `publicContent` fetch). */
    contentId: string
}

/** Page props with the awaited route params (Next.js App Router). */
interface ContentPageProps {
    /** Promise of the resolved route params. */
    params: Promise<ContentRouteParams>
}

/**
 * Public-content fetch, memoized per request so `generateMetadata` and the page
 * share a single round-trip. Unauthenticated (`publicContent`); returns null on
 * any error so SEO degrades gracefully instead of throwing.
 *
 * @param displayId - The content displayId from the route.
 */
const getPublicContent = cache(async (displayId: string) => {
    try {
        const result = await queryPublicContent({ request: { displayId } })
        return result.data?.publicContent?.data ?? null
    } catch {
        return null
    }
})

/**
 * Per-article SEO metadata (title, description, canonical, OpenGraph, Twitter)
 * resolved server-side from the public content so crawlers + social unfurls get
 * real values even though the body renders client-side.
 *
 * @param props - {@link ContentPageProps}
 */
export const generateMetadata = async ({ params }: ContentPageProps): Promise<Metadata> => {
    const { locale, contentId } = await params
    const content = await getPublicContent(contentId)
    if (!content) {
        return {}
    }
    const url = `${SEO_CONFIG.siteUrl}/${locale}/contents/${contentId}`
    const description = content.description ?? SEO_CONFIG.defaultDescription
    return {
        title: content.title,
        description,
        alternates: {
            canonical: url,
        },
        openGraph: {
            type: "article",
            title: content.title,
            description,
            url,
            siteName: SEO_CONFIG.siteName,
        },
        twitter: {
            card: "summary_large_image",
            title: content.title,
            description,
        },
    }
}

/**
 * Route `/[locale]/contents/[contentId]` — a public article page (no learn shell /
 * sidebar). Emits `LearningResource` JSON-LD server-side for rich results, then
 * mounts the client {@link ContentDetail} which renders the body.
 *
 * @param props - {@link ContentPageProps}
 */
const Page = async ({ params }: ContentPageProps) => {
    const { locale, contentId } = await params
    const content = await getPublicContent(contentId)
    if (!content) {
        notFound()
    }
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        "name": content.title,
        "description": content.description ?? SEO_CONFIG.defaultDescription,
        "url": `${SEO_CONFIG.siteUrl}/${locale}/contents/${contentId}`,
        "inLanguage": locale,
        "timeRequired": content.minutesRead ? `PT${content.minutesRead}M` : undefined,
        "isAccessibleForFree": !content.isPremium,
        "publisher": {
            "@type": "Organization",
            "name": SEO_CONFIG.siteName,
            "url": SEO_CONFIG.siteUrl,
        },
    }
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <PublicArticle content={content} />
        </>
    )
}

export default Page
