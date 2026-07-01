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
        if (!pathname.includes("/learn") && !pathname.includes("/headhunting-companies")) return
        hasSyncedFromUrlRef.current = true

        if (pathname.includes("/mind-map")) {
            dispatch(setSidebar({ tab: SidebarTab.MindMap, extraId: undefined }))
            return
        }
        if (pathname.includes("/modules") || pathname.includes("/learn/content")) {
            dispatch(setSidebar({ tab: SidebarTab.Modules, extraId: undefined }))
            return
        }
        if (pathname.includes("/personal-project")) {
            dispatch(setSidebar({ tab: SidebarTab.PersonalProject, extraId: undefined }))
            return
        }
        if (pathname.includes("/leaderboard")) {
            dispatch(setSidebar({ tab: SidebarTab.Leaderboard, extraId: undefined }))
            return
        }
        if (pathname.includes("/foundations")) {
            dispatch(setSidebar({ tab: SidebarTab.Foundations, extraId: undefined }))
            return
        }
        if (pathname.includes("/practice")) {
            dispatch(setSidebar({ tab: SidebarTab.Practice, extraId: undefined }))
            return
        }
        if (pathname.includes("/flashcards")) {
            dispatch(setSidebar({ tab: SidebarTab.Flashcards, extraId: undefined }))
            return
        }
        if (pathname.includes("/headhuntings") || pathname.includes("/headhunting-companies")) {
            dispatch(setSidebar({ tab: SidebarTab.Headhuntings, extraId: undefined }))
            return
        }
    }, [dispatch, locale, pathname])
}
