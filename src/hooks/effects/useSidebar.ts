import { useLocale } from "next-intl"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { useAppDispatch } from "@/redux/hooks"
import { setSidebar, SidebarTab } from "@/redux/slices/sidebar"

/**
 * useSidebar is a hook that is used to navigate to the correct path based on the sidebar state.
 */
export const useSidebar = () => {
    const dispatch = useAppDispatch()
    const pathname = usePathname()
    const locale = useLocale()
    const hasSyncedFromUrlRef = useRef(false)

    useEffect(() => {
        if (hasSyncedFromUrlRef.current) return
        if (!pathname.includes(`/${locale}/courses/`)) return
        if (!pathname.includes("/learn")) return
        hasSyncedFromUrlRef.current = true

        if (pathname.includes("/mind-map")) {
            dispatch(setSidebar({ tab: SidebarTab.MindMap, extraId: undefined }))
            return
        }
        if (pathname.includes("/modules") || pathname.includes("/learn/content")) {
            dispatch(setSidebar({ tab: SidebarTab.Modules, extraId: undefined }))
            return
        }
        if (pathname.includes("/leaderboard")) {
            dispatch(setSidebar({ tab: SidebarTab.Leaderboard, extraId: undefined }))
            return
        }
        // Các nhánh /personal-project, /foundations, /practice, /flashcards, /headhuntings
        // đã gỡ: route tương ứng bị xoá ở 12c485b nên điều kiện không bao giờ đúng.
    }, [dispatch, locale, pathname])
}
