import React, { cache } from "react"
import type { Metadata } from "next"
import { CourseDetail } from "@/components/features/course/CourseDetail"
import { getCourseDetail, type CourseDetail as CourseDetailView } from "@/modules/api/rest/course"
import { buildPageMetadata } from "@/modules/seo/buildMetadata"

/** Route params for `/[locale]/courses/[courseId]`. */
interface CourseParams {
    /** Active locale segment. */
    locale: string
    /** Course SLUG from the URL (the BE path variable is `slugName`, not the uuid). */
    courseId: string
}

/**
 * Course-detail fetch by slug, memoized per request. Server-side there is no
 * stored token, so this hits the public/anonymous projection — enough for the
 * share card (title, cover, summary), and it never leaks a gated curriculum.
 * Returns null on any failure so an unknown slug still renders the client page.
 */
const getCourse = cache(async (slug: string): Promise<CourseDetailView | null> => {
    try {
        return await getCourseDetail(slug)
    } catch {
        return null
    }
})

/** Strips HTML/markdown noise out of the BE description → a ~160 char meta line. */
const toDescription = (source: string): string => {
    const plain = source
        .replace(/<[^>]+>/g, " ")
        .replace(/[#>*_`~[\]()!]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    return plain.length > 160 ? `${plain.slice(0, 157)}…` : plain
}

/**
 * Per-course SEO + share metadata (title / description / canonical + hreflang /
 * OG + Twitter card with the real course cover). Without it every course link
 * unfurled as the generic site card, which is what a shared course link mostly is.
 */
export const generateMetadata = async ({
    params,
}: {
    params: Promise<CourseParams>
}): Promise<Metadata> => {
    const { locale, courseId } = await params
    const course = await getCourse(courseId)
    if (!course) {
        return {}
    }
    const description = toDescription(course.description || course.course.description || "")
    return buildPageMetadata({
        path: `/courses/${courseId}`,
        locale,
        title: course.course.title,
        description: description || undefined,
        images: course.course.imageHeader ? [course.course.imageHeader] : undefined,
    })
}

/**
 * `/courses/[courseId]` — course detail / sales page (§4). Server wrapper so the
 * route can expose `generateMetadata`; the page itself is the client
 * {@link CourseDetail}, which reads the slug from the route.
 */
const Page = () => <CourseDetail />

export default Page
