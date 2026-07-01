import { usePathname } from "next/navigation"
import useSWR from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { defaultLivestreamSessionsListSorts, queryLivestreamSessions } from "@/modules/api/graphql/queries/query-livestream-sessions"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setLivestreamSessions, setLivestreamSessionsCount } from "@/redux/slices/livestream-session"

/**
 * Lists course livestream sessions via `livestreamSessions` (enrolled + course id).
 * Only fetches under `/learn` (consumer: LivestreamCalendar in challenge/lesson-video).
 */
export const useQueryLivestreamSessionsSwr = () => {
    const enrolled = useAppSelector((state) => state.user.enrolled)
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const pageNumber = useAppSelector((state) => state.livestreamSession.pageNumber)
    const limit = useAppSelector((state) => state.livestreamSession.limit)
    const pathname = usePathname()
    const onLearnPage = pathname.includes("/learn")
    const dispatch = useAppDispatch()
    const swr = useSWR(
        enrolled && courseId && onLearnPage
            ? [
                "QUERY_LIVESTREAM_SESSIONS_SWR",
                courseId,
                enrolled,
                pageNumber,
                limit,
            ]
            : null,
        async () => {
            if (!courseId) {
                throw new Error("Course id not found")
            }
            const data = await queryLivestreamSessions({
                request: {
                    courseId,
                    filters: {
                        pageNumber,
                        limit,
                        sorts: defaultLivestreamSessionsListSorts,
                    },
                },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: courseId,
                },
            })
            const payload = data.data?.livestreamSessions?.data
            if (!payload) {
                throw new Error("Livestream sessions not found")
            }
            dispatch(setLivestreamSessions(payload.data))
            dispatch(setLivestreamSessionsCount(payload.count))
            return payload
        },
    )
    return swr
}
