"use client"

import {
    BracketsCurlyIcon,
    CardsIcon,
    GraduationCapIcon,
    MapPinLineIcon,
    StackIcon,
    UsersIcon,
} from "@phosphor-icons/react"
import {
    useCallback,
    useMemo,
} from "react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    pathConfig,
} from "@/resources/path"
import type {
    LearnNavItem,
} from "../types"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { SidebarTab, setSidebar } from "@/redux/slices/sidebar"
import { useQueryCourseEnrollmentStatusSwr } from "@/hooks/swr/api/graphql/queries/useQueryCourseEnrollmentStatusSwr"

/**
 * Result of {@link useSidebarNavItems}.
 */
export interface UseSidebarNavItemsResult {
    /** Ordered nav entries for the course-learn sidebar. */
    items: Array<LearnNavItem>
    /** Currently active sidebar tab (for row highlighting). */
    selectedTab: SidebarTab
    /** Fired with the chosen entry: switches tab then routes to its URL. */
    onSelect: (item: LearnNavItem) => void
}

/**
 * Builds the course-learn sidebar nav entries plus the select handler.
 *
 * Shared by the desktop {@link import("../LearnSidebar").LearnSidebar} and the
 * mobile drawer ({@link import("../LearnMobileBar").LearnMobileBar}) so both render
 * the exact same items + routing without duplicating the redux/route wiring.
 * @returns {@link UseSidebarNavItemsResult} entries, active tab, and select callback.
 */
export const useSidebarNavItems = (): UseSidebarNavItemsResult => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const dispatch = useAppDispatch()
    // course catalog drives the module-count label on the "modules" row
    const course = useAppSelector((state) => state.course.entity)
    // display id is the slug used to build every learn sub-route
    const courseDisplayId = useAppSelector((state) => state.course.displayId)
    // active tab from redux highlights the matching row
    const selectedSidebar = useAppSelector((state) => state.sidebar.sidebar)
    // enrollment drives the lock badge on hands-on rows; only lock once the status is KNOWN
    // (enrolled defaults false → would flash a lock on enrolled viewers otherwise).
    const enrollmentSwr = useQueryCourseEnrollmentStatusSwr()
    const enrolled = useAppSelector((state) => state.user.enrolled)
    const locked = (Boolean(enrollmentSwr.data) || Boolean(enrollmentSwr.error)) && !enrolled

    /** Record the active sidebar tab in Redux (routing is handled in {@link onSelect}). */
    const onSelectSidebarTab = useCallback(
        (tab: SidebarTab) => {
            dispatch(setSidebar({ tab, extraId: undefined }))
        },
        [dispatch],
    )

    // build the ordered nav entries; memoized so rows keep stable identity
    const items = useMemo<Array<LearnNavItem>>(
        () => [
            {
                label: t("mindMap.title"),
                value: "mind-map",
                tab: SidebarTab.MindMap,
                icon: MapPinLineIcon,
                group: "study",
                url: pathConfig().locale(locale).course(courseDisplayId).learn().mindMap().build(),
            },
            {
                label: t("modules.title", { count: course?.modules?.length ?? 0 }),
                value: "modules",
                tab: SidebarTab.Modules,
                icon: BracketsCurlyIcon,
                group: "study",
                // route to the course-contents index (the docs-style "chỉ mục" landing);
                // selecting a lesson there drills into its module/content route.
                url: pathConfig().locale(locale).course(courseDisplayId).learn().content().build(),
            },
            {
                label: t("foundations.title"),
                value: "foundations",
                tab: SidebarTab.Foundations,
                icon: StackIcon,
                group: "study",
                url: pathConfig().locale(locale).course(courseDisplayId).learn().foundations().build(),
            },
            {
                label: t("flashcard.title"),
                value: "flashcards",
                tab: SidebarTab.Flashcards,
                icon: CardsIcon,
                group: "practice",
                url: pathConfig().locale(locale).course(courseDisplayId).learn().flashcards().build(),
            },
            {
                label: t("finalProject.title"),
                value: "personal-project",
                tab: SidebarTab.PersonalProject,
                icon: GraduationCapIcon,
                group: "practice",
                url: pathConfig().locale(locale).course(courseDisplayId).learn().personalProject().build(),
                locked,
            },
            {
                label: t("leaderboard.title"),
                value: "leaderboard",
                tab: SidebarTab.Leaderboard,
                icon: UsersIcon,
                group: "practice",
                url: pathConfig().locale(locale).course(courseDisplayId).learn().leaderboard().build(),
            },
        ],
        [
            course?.modules?.length,
            courseDisplayId,
            locale,
            locked,
            t,
        ],
    )

    /** Route on selection: update Redux tab, then navigate once to the row URL. */
    const onSelect = useCallback(
        (item: LearnNavItem) => {
            onSelectSidebarTab(item.tab)
            if (!item.url) {
                return
            }
            router.push(item.url)
        },
        [
            onSelectSidebarTab,
            router,
        ],
    )

    return {
        items,
        selectedTab: selectedSidebar.tab,
        onSelect,
    }
}
