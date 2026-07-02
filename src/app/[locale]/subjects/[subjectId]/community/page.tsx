import { permanentRedirect } from "@/i18n/navigation"

/** Awaited `[locale]/subjects/[subjectId]` route params. */
interface PageProps {
    /** Next 15 async params. */
    params: Promise<{ locale: string; subjectId: string }>
}

/**
 * `/subjects/[subjectId]/community` — legacy segment. The workspace community tab
 * was renamed to Thảo luận (Discussion) by the subject-workspace IA; old links and
 * bookmarks land here and are forwarded to the new segment, same subject + locale.
 */
const Page = async ({ params }: PageProps) => {
    const { locale, subjectId } = await params
    permanentRedirect({ href: `/subjects/${subjectId}/discussion`, locale })
}

export default Page
