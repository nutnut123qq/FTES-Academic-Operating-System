import useSWRMutation from "swr/mutation"
import { mutateCourseEnroll } from "@/modules/api/graphql/mutations/mutation-course-enroll"
import { type CourseEnrollRequest } from "@/modules/api/graphql/mutations/types/course-enroll"

type MutateCourseEnrollResult = Awaited<ReturnType<typeof mutateCourseEnroll>>

/**
 * SWR mutation wrapper for {@link mutateCourseEnroll} (Bearer from Keycloak).
 */
export const useMutateCourseEnrollSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateCourseEnrollResult,
        Error,
        string,
        CourseEnrollRequest
    >(
        "MUTATE_COURSE_ENROLL_SWR",
        async (_key, { arg }) => {
            return mutateCourseEnroll({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
