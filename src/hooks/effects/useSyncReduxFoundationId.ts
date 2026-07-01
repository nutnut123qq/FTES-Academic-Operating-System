import { useEffect } from "react"
import { useParams, usePathname } from "next/navigation"
import { useAppDispatch } from "@/redux/hooks"
import { setFoundationId } from "@/redux/slices/foundation"

/**
 * Syncs foundation item id from the learn foundations detail route param.
 */
export const useSyncReduxFoundationId = () => {
    const dispatch = useAppDispatch()
    const pathname = usePathname()
    const params = useParams()

    useEffect(() => {
        if (params.foundationId) {
            dispatch(setFoundationId(params.foundationId as string))
            return
        }
        if (!pathname.includes("/foundations")) {
            dispatch(setFoundationId(undefined))
        }
    }, [dispatch, params.foundationId, pathname])
}
