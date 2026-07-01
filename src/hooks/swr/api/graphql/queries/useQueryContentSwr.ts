import { useParams } from "next/navigation"
import useSWR from "swr"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { queryContent } from "@/modules/api/graphql/queries/query-content"
import { useAppSelector } from "@/redux/hooks"

/**
 * Singleton SWR for `content(request: { id })`.
 * Keys are driven by URL `[contentId]` / `[moduleId]` so navigation refetches immediately
 * (Redux sync via `useSyncReduxContentId` alone is one frame late and can leave a stale id).
 *
 * Pure data hook — it does NOT touch Redux. Mirroring the result into `content.entity` (including
 * cache hits, e.g. navigating back to a viewed lesson) is owned by `useSyncReduxContent` in
 * `effects/`, keeping side effects out of the SWR hook.
 */
export const useQueryContentSwr = () => {
    const params = useParams()
    const routeContentId = params.contentId as string | undefined
    const routeModuleId = params.moduleId as string | undefined
    const reduxContentId = useAppSelector((state) => state.content.id)
    const reduxModuleId = useAppSelector((state) => state.module.id)
    const contentId = routeContentId ?? reduxContentId
    const moduleId = routeModuleId ?? reduxModuleId
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const course = useAppSelector((state) => state.course.entity)
    return useSWR(
        authenticated && contentId && moduleId && course?.id
            ? [
                "QUERY_CONTENT_SWR",
                contentId,
                moduleId,
                course.id,
                authenticated,
            ]
            : null,
        async () => {
            if (!contentId || !moduleId) {
                throw new Error("Content or module id not found")
            }
            const data = await queryContent({
                request: { id: contentId },
                headers: {
                    [GraphQLHeadersKey.XCourseId]: course?.id,
                },
            })
            if (!data?.data?.content?.data) {
                throw new Error("Content not found")
            }
            return data.data.content.data
        },
        {
            /** New content id → do not show the previous lesson body while loading. */
            keepPreviousData: false,
        },
    )
}
