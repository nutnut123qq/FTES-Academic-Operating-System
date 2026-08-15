import React, { cache } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { CommunityPostDetail } from "@/components/features/community/CommunityPostDetail"
import { getPublicPostCard, type PublicPostCard } from "@/modules/api/rest/community"
import { buildPageMetadata } from "@/modules/seo/buildMetadata"

/** Route params for `/[locale]/community/[postId]`. */
interface CommunityPostParams {
    /** Active locale segment. */
    locale: string
    /** Post id from the URL. */
    postId: string
}

/**
 * Public share card of the post, memoized per request.
 *
 * Reads `GET /community/public/posts/{id}` — the anonymous projection — NOT the
 * auth-gated detail: a server render carries no token, so the gated path could only
 * ever 401 here and every share link fell back to the generic community copy while
 * still paying for a doomed request per render.
 *
 * A null result is the normal outcome for a post that is not public (private group,
 * draft/hidden, deleted) as well as for one that does not exist — the BE returns the
 * same 404 for all of them on purpose, so a shared link to a private post unfurls as
 * the generic card rather than leaking that it exists.
 */
const getCommunityPostCard = cache(async (postId: string): Promise<PublicPostCard | null> => {
    try {
        return await getPublicPostCard(postId)
    } catch {
        return null
    }
})

/** First ~160 plain-text characters of the excerpt, for the meta description. */
const toDescription = (excerpt: string): string => {
    const plain = excerpt.replace(/\s+/g, " ").trim()
    return plain.length > 160 ? `${plain.slice(0, 157)}…` : plain
}

/**
 * Share/SEO metadata for a community post: the post's own title + excerpt (+ its
 * first image) when the post is public, otherwise the generic community card — a shared
 * link must never unfurl as an empty/incorrect page.
 */
export const generateMetadata = async ({
    params,
}: {
    params: Promise<CommunityPostParams>
}): Promise<Metadata> => {
    const { locale, postId } = await params
    const [card, t] = await Promise.all([
        getCommunityPostCard(postId),
        getTranslations({ locale }),
    ])
    const description = toDescription(card?.excerpt ?? "")
    const image = card?.imageUrl ?? undefined
    return buildPageMetadata({
        path: `/community/${postId}`,
        locale,
        type: "article",
        title: card?.title?.trim() || t("seo.communityPost.title"),
        description: description || t("seo.communityPost.description"),
        images: image ? [image] : undefined,
    })
}

/**
 * `/community/[postId]` — community post detail (§6). Server wrapper so the route
 * can expose `generateMetadata`; the body is the client {@link CommunityPostDetail},
 * which reads the post id from the route.
 */
const Page = () => <CommunityPostDetail />

export default Page
