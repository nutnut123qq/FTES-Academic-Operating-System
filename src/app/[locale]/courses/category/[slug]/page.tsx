import React from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { CategoryPage } from "@/components/features/course/CategoryPage"
import {
    categoryDescription,
    categoryName,
    findCategoryBySlug,
} from "@/components/features/course/browse/categories"

/** Route params of `/courses/category/[slug]`. */
interface PageProps {
    params: Promise<{ locale: string; slug: string }>
}

// Rendered dynamically (per-request), like `/courses`. Static prerender is not
// viable here: the page's content is client-fetched (SWR) and the render tree
// reads request-scoped locale (next-intl `headers()`), which throws
// DYNAMIC_SERVER_USAGE under static generation. `generateStaticParams` (which
// forced static prerender and caused a prod 500 on /courses/category/all) is
// intentionally omitted; `findCategoryBySlug` still guards unknown slugs → 404.
export const dynamic = "force-dynamic"

/** Localized title/description per category so crawlers index a real page. */
export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
    const { locale, slug } = await params
    const category = findCategoryBySlug(slug)
    if (!category) return {}
    return {
        title: categoryName(category, locale),
        description: categoryDescription(category, locale),
    }
}

/** `/courses/category/[slug]` — category landing page (§4); unknown slug → 404. */
const Page = async ({ params }: PageProps) => {
    const { slug } = await params
    if (!findCategoryBySlug(slug)) notFound()
    return <CategoryPage slug={slug} />
}

export default Page
