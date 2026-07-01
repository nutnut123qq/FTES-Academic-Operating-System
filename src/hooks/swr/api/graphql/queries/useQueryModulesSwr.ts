import useSWR from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryModules } from "@/modules/api/graphql/queries/query-modules"
import { useAppSelector, useAppDispatch } from "@/redux/hooks"
import { setModules } from "@/redux/slices/module"

/**
 * Lists all modules for the current course via `modules` ES query.
 * Dispatches `setModules` into the module redux slice.
 */
export const useQueryModulesSwr = () => {
    const enrolled = useAppSelector((state) => state.user.enrolled)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const course = useAppSelector((state) => state.course.entity)
    const dispatch = useAppDispatch()

    const swr = useSWR(
        authenticated && course?.id
            ? [
                "QUERY_MODULES_SWR",
                course.id,
                enrolled,
                authenticated,
            ]
            : null,
        async () => {
            if (!course?.id) {
                throw new Error("Course ID not found")
            }

            const data = await queryModules({
                request: {
                    courseId: course.id,
                },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: course.id,
                },
            })

            if (!data || !data.data) {
                throw new Error("Failed to fetch modules")
            }

            if (data.data.modules?.data?.data) {
                dispatch(setModules(data.data.modules.data.data))
            }

            return data.data
        },
        {
            /** On a cache hit, revalidate so the fetcher reruns + dispatches setModules (replaces the removed re-hydrate effect). */
            revalidateIfStale: true,
            revalidateOnMount: true,
        },
    )

    return swr
}
