import useSWR from "swr"
import { queryContentStatus } from "@/modules/api/graphql/queries/query-content-status"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setContentIsRead, setContentIsFavorite } from "@/redux/slices/content"

/**
 * Singleton SWR for `contentStatus(request: { contentId })` — fetches user's read/favorite status.
 */
export const useQueryContentStatusSwr = () => {
    const id = useAppSelector((state) => state.content.id)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const dispatch = useAppDispatch()
    const swr = useSWR(
        authenticated && id
            ? [
                "QUERY_CONTENT_STATUS_SWR",
                id,
                authenticated,
            ]
            : null,
        async () => {
            if (!id) {
                throw new Error("Content id not found")
            }
            const data = await queryContentStatus({
                request: { contentId: id },
            })
            if (data?.data?.contentStatus?.data) {
                dispatch(setContentIsRead(data.data.contentStatus.data.isRead))
                dispatch(setContentIsFavorite(data.data.contentStatus.data.isFavorite))
            }
            return data?.data?.contentStatus?.data
        },
    )
    return swr
}
