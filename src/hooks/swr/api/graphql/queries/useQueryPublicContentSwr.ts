import useSWR from "swr"
import { queryPublicContent } from "@/modules/api/graphql/queries/query-public-content"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setPublicContent } from "@/redux/slices/public-content"

/**
 * Singleton SWR for `publicContent(request: { displayId })` — no auth required.
 */
export const useQueryPublicContentSwr = () => {
    const displayId = useAppSelector((state) => state.publicContent.displayId)
    const dispatch = useAppDispatch()
    const swr = useSWR(
        displayId
            ? [
                "QUERY_PUBLIC_CONTENT_SWR",
                displayId,
            ]
            : null,
        async () => {
            if (!displayId) {
                throw new Error("Public content displayId not found")
            }
            const data = await queryPublicContent({
                request: { displayId },
            })
            if (!data?.data?.publicContent?.data) {
                throw new Error("Public content not found")
            }
            dispatch(setPublicContent(data.data.publicContent.data))
            return data.data.publicContent.data
        },
    )
    return swr
}
