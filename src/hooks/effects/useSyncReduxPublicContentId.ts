import { useEffect } from "react"
import { useParams, usePathname } from "next/navigation"
import { useAppDispatch } from "@/redux/hooks"
import { setPublicContentDisplayId } from "@/redux/slices/public-content"

/**
 * Syncs `publicContent.displayId` from the `[contentId]` route param into Redux on navigation.
 * @returns void
 */
export const useSyncReduxPublicContentId = () => {
    const dispatch = useAppDispatch()
    const pathname = usePathname()
    const params = useParams()
    useEffect(
        () => {
            if (params.contentId) {
                dispatch(setPublicContentDisplayId(params.contentId as string))
            }
        }, [pathname, params.contentId]
    )
}
