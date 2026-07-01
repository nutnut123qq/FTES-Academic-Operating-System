import type { MetadataRoute } from "next"
import { SEO_CONFIG } from "@/config/seo"

/**
 * `/robots.txt` — allow crawling of public pages, keep private / API areas out of
 * the index, and point crawlers at the sitemap. Authenticated surfaces (profile,
 * admin, dashboard, in-course learn shell) are disallowed; the public marketing +
 * article pages (`/contents/*`, courses, blog) stay open for SEO.
 */
const robots = (): MetadataRoute.Robots => ({
    rules: {
        userAgent: "*",
        allow: "/",
        disallow: [
            "/api/",
            "/admin",
            "/profile",
            "/dashboard",
            "/authentication",
            "/checkout",
        ],
    },
    sitemap: `${SEO_CONFIG.siteUrl}/sitemap.xml`,
})

export default robots
