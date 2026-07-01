import useSWR from "swr"
import { queryCourseEnrollmentStatus } from "@/modules/api/graphql/queries/query-course-enrollment-status"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setEnrolled, setEnrollment } from "@/redux/slices/user"

/**
 * The core function to query course enrollment status with SWR.
 */
export const useQueryCourseEnrollmentStatusSwr = () => {
    const dispatch = useAppDispatch()
    const course = useAppSelector((state) => state.course.entity)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR(
        course?.id && authenticated
            ? [
                "QUERY_COURSE_ENROLLMENT_STATUS_SWR",
                course?.id,
                authenticated,
            ]
            : null,
        async () => {
            if (!course?.id) {
                throw new Error("Course id not found")
            }
            const data = await queryCourseEnrollmentStatus({
                request: { courseId: course?.id },
            })
            if (!data || !data.data) {
                throw new Error("Course enrollment status not found")
            }
            dispatch(setEnrollment(data.data.courseEnrollmentStatus.data?.enrollment))
            dispatch(setEnrolled(Boolean(data.data.courseEnrollmentStatus.data?.isEnrolled)))
            return data.data
        }
    )
    return swr
}
