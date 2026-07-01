import type { IconComponent } from "@/types"
import type { SidebarTab } from "@/redux/slices/sidebar"

/**
 * Which separator-divided cluster a sidebar row belongs to: the course content
 * (`study`) or the hands-on work + leaderboard (`practice`).
 */
export type LearnNavGroup = "study" | "practice"

/**
 * One row in the course-learn sidebar navigation.
 */
export interface LearnNavItem {
    /** Visible label. */
    label: string
    /** Stable list key. */
    value: string
    /** Sidebar tab enum value this row activates. */
    tab: SidebarTab
    /** Icon component rendered before the label. */
    icon: IconComponent
    /** Which separator-divided group this row sits in. */
    group: LearnNavGroup
    /** Navigation target the row routes to when pressed. */
    url?: string
    /** Whether this surface is locked for the viewer (enroll-required + not enrolled). */
    locked?: boolean
}
