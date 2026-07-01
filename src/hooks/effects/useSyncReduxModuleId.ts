import { useLayoutEffect } from "react"
import { useParams, usePathname } from "next/navigation"
import { useAppDispatch } from "@/redux/hooks"
import { setModuleId } from "@/redux/slices/module"

/**
 * Syncs `module.id` from the `[moduleId]` route param into Redux on navigation.
 * @returns void
 */
export const useSyncReduxModuleId = () => {
    const dispatch = useAppDispatch()
    const pathname = usePathname()
    const params = useParams()
    useLayoutEffect(
        () => {
            const moduleId = params.moduleId as string | undefined
            dispatch(setModuleId(moduleId))
        },
        [
            dispatch,
            pathname,
            params.moduleId,
        ],
    )
}