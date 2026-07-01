import React, { cache } from "react"
import type { Metadata } from "next"
import { CourseDetail } from "@/components/features/course/CourseDetail"
import { SEO_CONFIG } from "@/config/seo"
import { publicEnv } from "@/resources/env/public"
import { JsonLd, courseSchema } from "@/modules/seo/jsonLd"
import { buildPageMetadata } from "@/modules/seo/buildMetadata"

/** Route params for `/[locale]/courses/[courseId]`. */
interface CourseParams {
    /** Active locale segment. */
    locale: string
    /** Course displayId from the URL. */
    courseId: string
}

/** Minimal course shape needed for SEO (subset of the full entity). */
interface CourseMeta {
    title: string
    description?: string | null
    coverImageUrl?: string | null
    originalPrice?: number | null
}

/** Only the fields needed for metadata + Course JSON-LD. */
const COURSE_META_QUERY =
    "query($request:CourseRequest!){course(request:$request){data{displayId title description coverImageUrl originalPrice}}}"

/**
 * Course fetch by displayId, memoized per request so `generateMetadata` and the
 * page body share one round-trip. Returns null on any error so SEO degrades
 * gracefully (the client {@link CourseDetail} renders its own state regardless).
 */
const getCourse = cache(async (displayId: string): Promise<CourseMeta | null> => {
    try {
        const response = await fetch(publicEnv().api.graphql, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: COURSE_META_QUERY,
                variables: { request: { displayId } },
            }),
            cache: "no-store",
        })
        const payload = await response.json()
        return (payload?.data?.course?.data as CourseMeta | undefined) ?? null
    } catch {
        return null
    }
})

/** Per-course SEO metadata (title/desc/canonical/hreflang/OG cover). */
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
    const description = course.description
        ? course.description.replace(/\s+/g, " ").trim().slice(0, 200)
        : undefined
    return buildPageMetadata({
        path: `/courses/${courseId}`,
        locale,
        title: course.title,
        description,
        images: course.coverImageUrl ? [course.coverImageUrl] : undefined,
    })
}

/**
 * Route `/[locale]/courses/[courseId]` — public course detail. Server component
 * for `generateMetadata` + Course JSON-LD; renders the client {@link CourseDetail}
 * which reads the courseId from the route itself.
 *
 * @param props.params - the awaited route params.
 */
const Page = async ({
    params,
}: {
    params: Promise<CourseParams>
}) => {
    const { locale, courseId } = await params
    const course = await getCourse(courseId)
    return (
        <>
            {course ? (
                <JsonLd
                    data={courseSchema({
                        name: course.title,
                        description: course.description ?? undefined,
                        url: `${SEO_CONFIG.siteUrl}/${locale}/courses/${courseId}`,
                        image: course.coverImageUrl ?? undefined,
                        priceVnd: course.originalPrice ?? undefined,
                        inLanguage: locale,
                    })}
                />
            ) : null}
            <CourseDetail />
        </>
    )
}

export default Page
