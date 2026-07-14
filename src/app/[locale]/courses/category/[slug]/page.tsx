import React, { cache } from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { CategoryPage } from "@/components/features/course/CategoryPage"
import { getCourseCategories } from "@/modules/api/rest/course"
import { toCourseCategory } from "@/components/features/course/browse/categories"

/** Route params of `/courses/category/[slug]`. */
interface PageProps {
    params: Promise<{ locale: string; slug: string }>
}

// Rendered dynamically (per-request), like `/courses`. Static prerender is NOT
// viable here: the render tree reads request-scoped locale (next-intl `headers()`),
// which throws DYNAMIC_SERVER_USAGE under static generation (a prior
// `generateStaticParams` here forced static prerender and caused a prod 500 on
// /courses/category/all). Keeping it dynamic ALSO means the build never has to
// reach the live category endpoint at prerender time. The category is instead
// resolved per-request from the real `GET /courses/categories`; an unknown slug
// still `notFound()`s.
export const dynamic = "force-dynamic"

/**
 * Resolves the route's category from the real category endpoint, memoized per
 * request so `generateMetadata` and the page body share one round-trip. Returns
 * `undefined` for an unknown slug so both callers can 404 / degrade gracefully.
 */
const resolveCategory = cache(async (slug: string) => {
    const categories = await getCourseCategories()
    const dto = categories.find((category) => category.slug === slug)
    return dto ? toCourseCategory(dto) : undefined
})

/** Localized title/description per category so crawlers index a real page. */
export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
    const { slug } = await params
    const category = await resolveCategory(slug)
    if (!category) return {}
    return {
        title: category.name,
        description: category.description,
    }
}

/** `/courses/category/[slug]` — category landing page (§4); unknown slug → 404. */
const Page = async ({ params }: PageProps) => {
    const { slug } = await params
    const category = await resolveCategory(slug)
    if (!category) notFound()
    return <CategoryPage category={category} />
}

export default Page
