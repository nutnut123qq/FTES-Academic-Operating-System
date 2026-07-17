import { redirect } from "next/navigation"

/** Route params for the legacy lesson route. */
interface LegacyLessonRouteParams {
    locale: string
    courseId: string
    lessonId: string
}

/**
 * Legacy `/courses/[courseId]/lessons/[lessonId]` — the standalone lesson view has
 * moved into the learn shell. Redirect old deep-links to the content dashboard so
 * bookmarks keep working instead of 404-ing.
 */
const Page = async ({ params }: { params: Promise<LegacyLessonRouteParams> }) => {
    const { locale, courseId } = await params
    redirect(`/${locale}/courses/${courseId}/learn/content`)
}

export default Page
