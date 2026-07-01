import React from "react"
import { SEO_CONFIG } from "@/config/seo"

/** Brand social profiles for `Organization.sameAs`. */
const BRAND_SAME_AS: ReadonlyArray<string> = [
    "https://www.facebook.com/starci183/",
    "https://www.linkedin.com/in/stacy-nguyen-375b41324/",
    "https://github.com/starci183",
]

/** Props for {@link JsonLd}. */
export interface JsonLdProps {
    /** One schema.org object, or an array of them. `undefined` fields are dropped by `JSON.stringify`. */
    data: Record<string, unknown> | Array<Record<string, unknown>>
}

/**
 * Emits a `<script type="application/ld+json">` with the given schema.org data.
 * Server-rendered so crawlers see structured data in the initial HTML.
 *
 * @param props - {@link JsonLdProps}
 */
export const JsonLd = ({ data }: JsonLdProps) => (
    <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
)

/** schema.org `Organization` for the brand (logo + social profiles). */
export const organizationSchema = (): Record<string, unknown> => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SEO_CONFIG.siteName,
    "url": SEO_CONFIG.siteUrl,
    "logo": `${SEO_CONFIG.siteUrl}/logo.png`,
    "sameAs": BRAND_SAME_AS,
})

/** schema.org `WebSite` (helps Google associate the site name). */
export const websiteSchema = (locale: string): Record<string, unknown> => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SEO_CONFIG.siteName,
    "url": SEO_CONFIG.siteUrl,
    "inLanguage": locale,
})

/** Input for {@link courseSchema}. */
export interface CourseSchemaInput {
    name: string
    description?: string
    url: string
    image?: string
    /** List price in VND (raw), if known. */
    priceVnd?: number
    inLanguage: string
}

/** schema.org `Course` (provider + optional offer) for course-detail rich results. */
export const courseSchema = (input: CourseSchemaInput): Record<string, unknown> => ({
    "@context": "https://schema.org",
    "@type": "Course",
    "name": input.name,
    "description": input.description ?? SEO_CONFIG.defaultDescription,
    "url": input.url,
    "inLanguage": input.inLanguage,
    "image": input.image,
    "provider": {
        "@type": "Organization",
        "name": SEO_CONFIG.siteName,
        "url": SEO_CONFIG.siteUrl,
    },
    "offers": input.priceVnd != null
        ? {
            "@type": "Offer",
            "price": input.priceVnd,
            "priceCurrency": "VND",
            "availability": "https://schema.org/InStock",
            "url": input.url,
        }
        : undefined,
    "hasCourseInstance": {
        "@type": "CourseInstance",
        "courseMode": "online",
    },
})

/** Input for {@link articleSchema}. */
export interface ArticleSchemaInput {
    headline: string
    description?: string
    url: string
    image?: string
    /** ISO timestamp. */
    datePublished?: string
    inLanguage: string
    timeRequiredMinutes?: number
    isFree?: boolean
}

/** schema.org `BlogPosting` for blog-article rich results. */
export const articleSchema = (input: ArticleSchemaInput): Record<string, unknown> => ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": input.headline,
    "description": input.description ?? SEO_CONFIG.defaultDescription,
    "url": input.url,
    "inLanguage": input.inLanguage,
    "image": input.image,
    "datePublished": input.datePublished,
    "timeRequired": input.timeRequiredMinutes != null ? `PT${input.timeRequiredMinutes}M` : undefined,
    "isAccessibleForFree": input.isFree,
    "author": {
        "@type": "Organization",
        "name": SEO_CONFIG.siteName,
        "url": SEO_CONFIG.siteUrl,
    },
    "publisher": {
        "@type": "Organization",
        "name": SEO_CONFIG.siteName,
        "url": SEO_CONFIG.siteUrl,
        "logo": {
            "@type": "ImageObject",
            "url": `${SEO_CONFIG.siteUrl}/logo.png`,
        },
    },
})

/** Input for {@link personSchema}. */
export interface PersonSchemaInput {
    name: string
    url: string
    image?: string
    description?: string
}

/** schema.org `Person` for a public profile (the "hire me" angle). */
export const personSchema = (input: PersonSchemaInput): Record<string, unknown> => ({
    "@context": "https://schema.org",
    "@type": "Person",
    "name": input.name,
    "url": input.url,
    "image": input.image,
    "description": input.description,
    "worksFor": {
        "@type": "Organization",
        "name": SEO_CONFIG.siteName,
        "url": SEO_CONFIG.siteUrl,
    },
})
