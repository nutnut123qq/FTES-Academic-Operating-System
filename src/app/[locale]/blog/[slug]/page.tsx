import React, { cache } from "react"
import type { Metadata } from "next"
import { SEO_CONFIG } from "@/config/seo"
import { BlogPost } from "@/components/layouts/blog/BlogPost"
import { getBlogPostBySlug, type BlogPostDetail } from "@/modules/api/rest/blog"
import { JsonLd, articleSchema } from "@/modules/seo/jsonLd"
import { buildPageMetadata } from "@/modules/seo/buildMetadata"

// Rendered per-request: the detail fetch hits the live blog endpoint and records a
// view server-side, so it must not be prerendered/cached at build time.
export const dynamic = "force-dynamic"

/** Route params for `/[locale]/blog/[slug]`. */
interface BlogParams {
    /** Active locale segment. */
    locale: string
    /** Blog post slug from the URL. */
    slug: string
}

/**
 * Blog-post fetch by slug, memoized per request so `generateMetadata` and the
 * page body share one round-trip. Returns null when the slug is unknown (the BE
 * 404s → the client {@link BlogPost} renders its own not-found state regardless).
 */
const getPost = cache(async (slug: string): Promise<BlogPostDetail | null> => {
    try {
        return await getBlogPostBySlug(slug)
    } catch {
        return null
    }
})

/** Strips markdown to a plain-text meta description (~160 chars). */
const toDescription = (markdown: string): string => {
    const plain = markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/[#>*_`~[\]()!-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    return plain.length > 160 ? `${plain.slice(0, 157)}…` : plain
}

/** Per-post SEO metadata (title/description/canonical/hreflang/OG cover, article type). */
export const generateMetadata = async ({
    params,
}: {
    params: Promise<BlogParams>
}): Promise<Metadata> => {
    const { locale, slug } = await params
    const post = await getPost(slug)
    if (!post) {
        return {}
    }
    return buildPageMetadata({
        path: `/blog/${slug}`,
        locale,
        type: "article",
        title: post.title,
        description: toDescription(post.contentMd),
        images: post.thumbnailUrl ? [post.thumbnailUrl] : undefined,
    })
}

/**
 * Route `/[locale]/blog/[slug]` — public blog article. Server component for
 * `generateMetadata` + BlogPosting JSON-LD; renders the client {@link BlogPost}
 * which reads the slug from the route itself.
 *
 * @param props.params - the awaited route params.
 */
const Page = async ({
    params,
}: {
    params: Promise<BlogParams>
}) => {
    const { locale, slug } = await params
    const post = await getPost(slug)
    return (
        <>
            {post ? (
                <JsonLd
                    data={articleSchema({
                        headline: post.title,
                        description: toDescription(post.contentMd),
                        url: `${SEO_CONFIG.siteUrl}/${locale}/blog/${slug}`,
                        image: post.thumbnailUrl ?? undefined,
                        datePublished: post.publishedAt ?? undefined,
                        inLanguage: locale,
                    })}
                />
            ) : null}
            <BlogPost />
        </>
    )
}

export default Page
