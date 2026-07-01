import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setFoundation, setFoundationCategory, setFoundations } from "@/redux/slices/foundation"

/**
 * Resolves the active foundation category entity from loaded categories + category id.
 */
export const useSyncFoundationCategory = () => {
    const dispatch = useAppDispatch()
    const categories = useAppSelector((state) => state.foundation.categories)
    const categoryId = useAppSelector((state) => state.foundation.categoryId)
    const category = useAppSelector((state) => state.foundation.category)

    useEffect(() => {
        if (!categoryId || !categories?.length) {
            return
        }
        const selected = categories.find((item) => item.id === categoryId)
        if (!selected || selected.id === category?.id) {
            return
        }
        // category id changed — drop stale resources before the new SWR key resolves
        dispatch(setFoundations(undefined))
        dispatch(setFoundation(undefined))
        dispatch(setFoundationCategory(selected))
    }, [categories, category?.id, categoryId, dispatch])
}
