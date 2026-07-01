import useSWR from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryContents } from "@/modules/api/graphql/queries/query-contents"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setContents, setContentsCount } from "@/redux/slices/content"

/**
 * Lists module contents via `contents` and merges rows into `course.module.contents`.
 */
export const useQueryContentsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const enrolled = useAppSelector((state) => state.user.enrolled)
    const course = useAppSelector((state) => state.course.entity)
    const module = useAppSelector((state) => state.module.entity)
    const pageNumber = useAppSelector(
        (state) => state.module.pageNumber,
    )
    const limit = useAppSelector(
        (state) => state.module.limit,
    )
    const dispatch = useAppDispatch()
    return useSWR(
        authenticated && enrolled && course?.id && module?.id
            ? [
                "QUERY_CONTENTS_SWR",
                module?.id,
                course?.id,
                enrolled,
                authenticated,
                pageNumber,
                limit,
            ]
            : null,
        async () => {
            if (!module?.id || !course?.id) {
                throw new Error("Module or course id not found")
            }
            const data = await queryContents({
                request: {
                    moduleId: module?.id,
                    filters: {
                        pageNumber,
                        limit,
                        sorts: [],
                    },
                },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: course?.id,
                },
            })
            const payload = data.data?.contents?.data
            if (!payload) {
                throw new Error("Contents not found")
            }
            dispatch(setContents(payload.data))
            dispatch(setContentsCount(payload.count))
            return payload
        }
    )
}
