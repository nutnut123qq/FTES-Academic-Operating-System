import { permanentRedirect } from "@/i18n/navigation"

/** Awaited `[locale]/subjects/[subjectId]` route params. */
interface PageProps {
    /** Next 15 async params. */
    params: Promise<{ locale: string; subjectId: string }>
}

/**
 * `/subjects/[subjectId]/learning` — removed by the subject-workspace IA (structured
 * learning lives only in the Course module). The route stays resolvable so old links
 * never 404: it forwards to the workspace Overview, where the "Khóa học của môn này"
 * card links out to `/courses/[courseId]`.
 */
const Page = async ({ params }: PageProps) => {
    const { locale, subjectId } = await params
    permanentRedirect({ href: `/subjects/${subjectId}`, locale })
}

export default Page
