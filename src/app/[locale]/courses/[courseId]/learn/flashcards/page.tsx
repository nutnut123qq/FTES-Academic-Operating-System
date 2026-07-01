import { redirect } from "next/navigation"

interface PageProps {
    params: Promise<{ locale: string; courseId: string }>
}

/**
 * Bare `/learn/flashcards` redirects to the study (review) mode, so each mode
 * lives under a readable English slug (`/review` · `/interview`).
 */
const Page = async ({ params }: PageProps) => {
    const { locale, courseId } = await params
    redirect(`/${locale}/courses/${courseId}/learn/flashcards/review`)
}

export default Page
