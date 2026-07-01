import { useEffect } from "react"
import { useParams, usePathname } from "next/navigation"
import { useAppDispatch } from "@/redux/hooks"
import { setCourseDisplayId } from "@/redux/slices/course"

/**
 * Syncs `course.displayId` from the `[courseId]` route param into Redux on navigation.
 * @returns void
 */
export const useSyncReduxCourseId = () => {
    const dispatch = useAppDispatch()
    const pathname = usePathname()
    const params = useParams()
    useEffect(
        () => {
            if (params.courseId) {
                dispatch(setCourseDisplayId(params.courseId as string))
            }
        }, [pathname, params.courseId]
    )
}