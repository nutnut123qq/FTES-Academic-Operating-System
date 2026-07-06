import { redirect } from "next/navigation"

/** Route params for the learn index. */
interface LearnIndexRouteParams {
    locale: string
    courseId: string
}

/**
 * `/courses/[courseId]/learn` — the learn root has no surface of its own; send the
 * learner to the content dashboard (the tree + reader live under `content`).
 */
const Page = async ({ params }: { params: Promise<LearnIndexRouteParams> }) => {
    const { locale, courseId } = await params
    redirect(`/${locale}/courses/${courseId}/learn/content`)
}

export default Page
