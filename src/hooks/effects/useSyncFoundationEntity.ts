import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setFoundation } from "@/redux/slices/foundation"

/**
 * Resolves the active foundation entity from the loaded list and URL id.
 */
export const useSyncFoundationEntity = () => {
    const dispatch = useAppDispatch()
    const pathname = usePathname()
    const entities = useAppSelector((state) => state.foundation.entities)
    const foundationId = useAppSelector((state) => state.foundation.foundationId)
    const entity = useAppSelector((state) => state.foundation.entity)

    useEffect(() => {
        if (!pathname.includes("/foundations")) {
            if (entity) {
                dispatch(setFoundation(undefined))
            }
            return
        }

        if (!foundationId) {
            return
        }

        const selected = entities?.find((item) => item.id === foundationId)
        if (selected?.id !== entity?.id) {
            dispatch(setFoundation(selected))
        }
    }, [
        dispatch,
        entities,
        entity?.id,
        foundationId,
        pathname,
    ])
}
