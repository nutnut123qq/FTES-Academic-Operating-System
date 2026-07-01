import type { GraphQLResponse } from "../../types"

/**
 * Editorial pillar of a blog post. Values are the GraphQL enum NAMES sent over
 * the wire (`DEEP_DIVE`, …) — GraphQL enum names cannot contain hyphens, so the
 * backend exposes these snake_case names that map to its hyphenated DB values
 * (`deep-dive`, …). Mirrors backend `GraphQLTypeBlogCategory`.
 */
export enum BlogCategory {
    /** Long technical deep-dive extending a course topic (SEO magnet). */
    DeepDive = "DEEP_DIVE",
    /** Behind-the-scenes engineering / founder build-in-public note. */
    BuildInPublic = "BUILD_IN_PUBLIC",
    /** Career, roadmap and interview-prep guidance. */
    Career = "CAREER",
    /** AI / LLM engineering article. */
    Ai = "AI",
    /** Learner success story / case study. */
    CaseStudy = "CASE_STUDY",
    /** Guided analysis of this codebase's source (open-source onboarding). */
    Codebase = "CODEBASE",
}

/** One render-ready blog card for the listing (locale-resolved, body omitted). */
export interface QueryBlogPostListItem {
    /** Blog post id. */
    id: string
    /** URL slug — the `/blog/[slug]` route key. */
    slug: string
    /** Headline (locale-resolved). */
    title: string
    /** Short summary (locale-resolved), or null. */
    excerpt: string | null
    /** Editorial pillar chip. */
    category: BlogCategory
    /** Cover image URL, or null. */
    coverImageUrl: string | null
    /** Estimated reading time in minutes, or null. */
    readingMinutes: number | null
    /** Whether the full body is members-only. */
    isPremium: boolean
    /** When the post was published (ISO string). */
    publishedAt: string
}

/** Variables for the `blogPosts` query (all optional). */
export interface QueryBlogPostsRequest {
    /** Filter to a single editorial pillar; omit for all. */
    category?: BlogCategory
    /** Max posts to return. */
    limit?: number
    /** How many posts to skip (pagination). */
    offset?: number
}

/** Apollo response shape for `blogPosts`. */
export interface QueryBlogPostsResponse {
    /** Top-level field wrapping the standard API response (data = the list). */
    blogPosts: GraphQLResponse<Array<QueryBlogPostListItem>>
}

/** One full blog article (locale-resolved; body gated when premium). */
export interface QueryBlogPostDetail {
    /** Blog post id. */
    id: string
    /** URL slug — the `/blog/[slug]` route key. */
    slug: string
    /** Headline (locale-resolved). */
    title: string
    /** Short summary (locale-resolved), or null. */
    excerpt: string | null
    /** Full body (markdown, locale-resolved); truncated when locked. */
    body: string
    /** Editorial pillar chip. */
    category: BlogCategory
    /** Cover image URL, or null. */
    coverImageUrl: string | null
    /** Estimated reading time in minutes, or null. */
    readingMinutes: number | null
    /** Funnel CTA destination (e.g. related course URL), or null. */
    ctaUrl: string | null
    /** CTA button label (locale-resolved), or null. */
    ctaLabel: string | null
    /** "View on GitHub" source link for codebase posts, or null. */
    sourceUrl: string | null
    /** Whether the full body is members-only. */
    isPremium: boolean
    /** True when the body was truncated for a non-member viewer. */
    isLocked: boolean
    /** When the post was published (ISO string). */
    publishedAt: string
}

/** Variables for the `blogPost` query. */
export interface QueryBlogPostRequest {
    /** The `/blog/[slug]` route key. */
    slug: string
}

/** Apollo response shape for `blogPost`. */
export interface QueryBlogPostResponse {
    /** Top-level field wrapping the standard API response (data = the article, or null). */
    blogPost: GraphQLResponse<QueryBlogPostDetail | null>
}
