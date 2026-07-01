import { pathConfig } from "@/resources/path"
import { useLocale } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAppSelector } from "@/redux/hooks"

/**
 * Graceful fallback for the removed module index/overview. `/learn/content/modules`
 * has no page anymore — the content dashboard (`/learn/content`) + the lesson reader
 * (`/learn/content/modules/<id>/contents/<id>`) replaced it. Anything that still lands
 * on the bare module index is forwarded to the content dashboard instead of 404-ing.
 *
 * NOTE: `/learn/content` and `/learn/personal-project` deliberately land on their own
 * dashboards and do NOT auto-forward into an item — the learner resumes via the explicit
 * "Tiếp tục" action.
 */
export const useDefaultRedirect = () => {
    const router = useRouter()
    const pathname = usePathname()
    const locale = useLocale()
    const course = useAppSelector((state) => state.course.entity)
    const courseDisplayId = useAppSelector((state) => state.course.displayId)

    useEffect(() => {
        if (!course || !courseDisplayId) {
            return
        }

        const learnModuleBase = pathConfig().locale(locale).course(courseDisplayId).learn().module().build()
        if (pathname === learnModuleBase || pathname === `${learnModuleBase}/`) {
            router.replace(
                pathConfig().locale(locale).course(courseDisplayId).learn().content().build(),
            )
        }
    }, [
        course,
        courseDisplayId,
        locale,
        pathname,
        router,
    ])
}
