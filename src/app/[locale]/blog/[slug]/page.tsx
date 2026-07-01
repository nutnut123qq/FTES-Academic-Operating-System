import React, { cache } from "react"
import type { Metadata } from "next"
import { SEO_CONFIG } from "@/config/seo"
import { BlogPost } from "@/components/layouts/blog/BlogPost"
import { publicEnv } from "@/resources/env/public"
import { JsonLd, articleSchema } from "@/modules/seo/jsonLd"
import { buildPageMetadata } from "@/modules/seo/buildMetadata"

/** Route params for `/[locale]/blog/[slug]`. */
interface BlogParams {
    /** Active locale segment. */
    locale: string
    /** Blog post slug from the URL. */
    slug: string
}

/** Minimal blog-post shape needed for SEO. */
interface BlogPostMeta {
    title: string
    excerpt?: string | null
    coverImageUrl?: string | null
    readingMinutes?: number | null
    isPremium?: boolean | null
    publishedAt?: string | null
}

/** Only the fields needed for metadata + Article JSON-LD. */
const BLOG_META_QUERY =
    "query($slug:String!){blogPost(slug:$slug){data{slug title excerpt coverImageUrl readingMinutes isPremium publishedAt}}}"

/**
 * Blog-post fetch by slug, memoized per request so `generateMetadata` and the
 * page body share one round-trip. Returns null on any error so SEO degrades
 * gracefully (the client {@link BlogPost} renders its own state regardless).
 */
const getPost = cache(async (slug: string): Promise<BlogPostMeta | null> => {
    try {
        const response = await fetch(publicEnv().api.graphql, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: BLOG_META_QUERY,
                variables: { slug },
            }),
            cache: "no-store",
        })
        const payload = await response.json()
        return (payload?.data?.blogPost?.data as BlogPostMeta | undefined) ?? null
    } catch {
        return null
    }
})

/** Per-post SEO metadata (title/excerpt/canonical/hreflang/OG cover, article type). */
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
        description: post.excerpt ?? undefined,
        images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
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
                        description: post.excerpt ?? undefined,
                        url: `${SEO_CONFIG.siteUrl}/${locale}/blog/${slug}`,
                        image: post.coverImageUrl ?? undefined,
                        datePublished: post.publishedAt ?? undefined,
                        inLanguage: locale,
                        timeRequiredMinutes: post.readingMinutes ?? undefined,
                        isFree: post.isPremium != null ? !post.isPremium : undefined,
                    })}
                />
            ) : null}
            <BlogPost />
        </>
    )
}

export default Page
