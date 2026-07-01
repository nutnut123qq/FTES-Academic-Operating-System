import { redirect } from "next/navigation"

interface PageProps {
    params: Promise<{ locale: string; courseId: string }>
}

/**
 * Bare `/learn` is now an alias of the course-contents home: redirect to
 * `/learn/content` so old links + entry points keep working.
 */
const Page = async ({ params }: PageProps) => {
    const { locale, courseId } = await params
    redirect(`/${locale}/courses/${courseId}/learn/content`)
}

export default Page
