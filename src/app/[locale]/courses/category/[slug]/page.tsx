import React from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { CategoryPage } from "@/components/features/course/CategoryPage"
import {
    COURSE_CATEGORIES,
    categoryDescription,
    categoryName,
    findCategoryBySlug,
} from "@/components/features/course/browse/categories"

/** Route params of `/courses/category/[slug]`. */
interface PageProps {
    params: Promise<{ locale: string; slug: string }>
}

/** Category slugs are a known finite set — pre-render each for SEO. */
export const generateStaticParams = () =>
    COURSE_CATEGORIES.map((category) => ({ slug: category.slug }))

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
