import type { MetadataRoute } from "next"
import { SEO_CONFIG } from "@/config/seo"
import { publicEnv } from "@/resources/env/public"

const LOCALES = SEO_CONFIG.locales
const CANON = SEO_CONFIG.defaultLocale

/** Static public routes worth indexing, with their relative priority. */
const STATIC_ROUTES: ReadonlyArray<{ path: string, priority: number }> = [
    { path: "/home", priority: 1 },
    { path: "/courses", priority: 0.9 },
    { path: "/blog", priority: 0.7 },
    { path: "/contact", priority: 0.4 },
    { path: "/privacy", priority: 0.2 },
    { path: "/terms", priority: 0.2 },
]

/** hreflang alternates for a path across every locale. */
const languagesFor = (path: string): Record<string, string> =>
    Object.fromEntries(LOCALES.map((l): [string, string] => [l, `${SEO_CONFIG.siteUrl}/${l}${path}`]))

/** One sitemap entry: canonical = default-locale url + hreflang alternates. */
const entry = (
    path: string,
    priority: number,
    lastModified?: string,
): MetadataRoute.Sitemap[number] => ({
    url: `${SEO_CONFIG.siteUrl}/${CANON}${path}`,
    changeFrequency: "weekly",
    priority,
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages: languagesFor(path) },
})

/** Best-effort public GraphQL POST for sitemap discovery; never throws (5s timeout). */
const fetchGraphql = async (
    query: string,
    variables: Record<string, unknown>,
): Promise<unknown> => {
    try {
        const response = await fetch(publicEnv().api.graphql, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables }),
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
        })
        return await response.json()
    } catch {
        return null
    }
}

/** All course displayIds (empty on any failure → sitemap degrades to static). */
const fetchCourseSlugs = async (): Promise<string[]> => {
    const payload = await fetchGraphql(
        "query($request:CoursesRequest!){courses(request:$request){data{data{displayId}}}}",
        { request: {} },
    ) as { data?: { courses?: { data?: { data?: Array<{ displayId?: string }> } } } } | null
    return (payload?.data?.courses?.data?.data ?? [])
        .map((course) => course.displayId)
        .filter((id): id is string => Boolean(id))
}

/** All published blog posts (slug + publishedAt); empty on any failure. */
const fetchBlogPosts = async (): Promise<Array<{ slug: string, publishedAt?: string }>> => {
    const payload = await fetchGraphql(
        "query($limit:Int){blogPosts(limit:$limit){data{slug publishedAt}}}",
        { limit: 1000 },
    ) as { data?: { blogPosts?: { data?: Array<{ slug?: string, publishedAt?: string }> } } } | null
    return (payload?.data?.blogPosts?.data ?? [])
        .filter((post): post is { slug: string, publishedAt?: string } => Boolean(post.slug))
}

/**
 * `/sitemap.xml` — static public routes plus every course + published blog post,
 * each with vi/en hreflang alternates. Entity lists are fetched at request time
 * from the public GraphQL API; if the API is unreachable the sitemap degrades to
 * the static routes (never throws / breaks the build).
 */
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
    const [courseSlugs, blogPosts] = await Promise.all([
        fetchCourseSlugs(),
        fetchBlogPosts(),
    ])
    return [
        ...STATIC_ROUTES.map((route) => entry(route.path, route.priority)),
        ...courseSlugs.map((id) => entry(`/courses/${id}`, 0.8)),
        ...blogPosts.map((post) => entry(`/blog/${post.slug}`, 0.6, post.publishedAt)),
    ]
}

export default sitemap
