import { CombinedGraphQLErrors } from "@apollo/client"
import useSWR from "swr"
import { queryMyCourseOutline } from "@/modules/api/graphql/queries/query-my-course-outline"
import type { MyCourseOutlinePayload } from "@/modules/api/graphql/queries/types/my-course-outline"
import { useAppSelector } from "@/redux/hooks"

/** Backend exception code raised when the viewer has no enrollment for the course. */
const ENROLLMENT_NOT_FOUND_CODE = "ENROLLMENT_NOT_FOUND_EXCEPTION"

/** Default capped retry policy for transient errors (network / 5xx). */
const MAX_RETRIES = 5
const RETRY_INTERVAL_MS = 5000

/**
 * Whether a thrown SWR error is the permanent "not enrolled" GraphQL error — retrying it is
 * pointless (it never heals) and just hammers the server every few seconds.
 * @param error - The error SWR caught from the fetcher.
 */
const isEnrollmentNotFound = (error: unknown): boolean =>
    CombinedGraphQLErrors.is(error)
    && error.errors.some(
        (gqlError) => gqlError.extensions?.code === ENROLLMENT_NOT_FOUND_CODE
            || gqlError.message?.includes("No enrollment"),
    )

/**
 * SWR wrapper for {@link queryMyCourseOutline}. Fetches the signed-in viewer's
 * full outline (module/lesson/challenge + milestone/task trees with progress
 * overlaid) for one enrolled course. `data` is the outline payload or `undefined`
 * while loading.
 *
 * Keyed on the raw `courseId`: a `null` id yields a `null` key, so SWR makes no
 * request (e.g. before a course is selected). User-scoped — only runs once the
 * viewer is authenticated.
 *
 * @param courseId - The RAW course entity id (decode a `globalId` with
 *   `fromGlobalId`), or `null` to skip fetching.
 */
export const useQueryMyCourseOutlineSwr = (courseId: string | null) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<MyCourseOutlinePayload>(
        authenticated && courseId
            ? ["QUERY_MY_COURSE_OUTLINE_SWR", courseId]
            : null,
        async () => {
            if (!courseId) {
                throw new Error("Course id not found")
            }
            const result = await queryMyCourseOutline({
                request: {
                    courseId,
                },
            })
            const payload = result.data?.myCourseOutline?.data
            if (!payload) {
                throw new Error("Course outline not found")
            }
            return payload
        },
        {
            // "not enrolled" is a PERMANENT error: stop retrying immediately so SWR doesn't
            // re-hit the server every few seconds (which spammed the backend logs). Other
            // (transient) errors keep a small capped retry.
            onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
                if (isEnrollmentNotFound(error)) {
                    return
                }
                if (retryCount >= MAX_RETRIES) {
                    return
                }
                setTimeout(() => { void revalidate({ retryCount }) }, RETRY_INTERVAL_MS)
            },
        },
    )
}
