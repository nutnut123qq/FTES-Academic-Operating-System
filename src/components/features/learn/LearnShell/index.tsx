"use client"

import React, { PropsWithChildren, ReactNode } from "react"
import { cn } from "@heroui/react"
import { LearnSidebar } from "./LearnSidebar"
import { LearnMobileBar } from "./LearnMobileBar"
import { LearnMobileTabBar } from "./LearnMobileTabBar"
import { LearnPanelToggles } from "./LearnPanelToggles"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link LearnShell}. */
export interface LearnShellProps extends WithClassNames<undefined>, PropsWithChildren {
    /**
     * The route's persistent left content rail (the course content-map), rendered
     * by the route layout between the course-nav icon rail and the content. Owns
     * its own width + sticky behavior; always visible (no collapse).
     */
    leftRail?: ReactNode
    /**
     * The route's right rail (on-this-page outline / milestone rail), rendered by
     * the route layout and slotted in here. When omitted the content spans full
     * width.
     */
    rightRail?: ReactNode
    /**
     * Whether the right rail exposes the desktop collapse handle + divider (used
     * by the redux-driven milestone rail). On-this-page rails self-size, so they
     * leave this off. Defaults to `false`.
     */
    showRightCollapse?: boolean
    /**
     * Opt out of the shell's canonical `p-6` content padding for full-bleed routes
     * (e.g. the mind-map canvas, which fills the viewport edge-to-edge). Every
     * other learn page reads as a padded reading column, so the shell owns that
     * `p-6` once here instead of each feature re-declaring it. Defaults to `false`.
     */
    fullBleed?: boolean
    /**
     * Force the simple course-nav drawer bar on mobile even when a {@link LearnShellProps.leftRail}
     * is present. The reader's {@link LearnMobileTabBar} is content-specific (it
     * folds the content-map + on-this-page into bottom tabs); a non-reader left
     * rail (e.g. the leaderboard category rail, which hides on mobile and offers a
     * chip row in-page instead) opts into the plain bar. Defaults to `false`.
     */
    simpleMobileBar?: boolean
}

/**
 * Shell for the course-learn pages: the left course-nav rail, the mobile toolbar,
 * the desktop right-rail collapse handle, and the content column. Composes the
 * left rail ({@link LearnSidebar}) as a self-sizing, collapse-in-place flex
 * sibling (the {@link import("@/components/blocks").CollapsibleSidebar} block owns
 * its own width animation + persistence) beside the content. The route layout
 * supplies its own right rail (module outline on lesson routes, milestone rail on
 * personal-project) through {@link LearnShellProps.rightRail}; that rail keeps its
 * existing redux-driven `rightCollapsed` behavior, exposed via the right collapse
 * handle in {@link LearnPanelToggles}.
 *
 * @param props - {@link LearnShellProps}
 */
export const LearnShell = ({
    children,
    leftRail,
    rightRail,
    showRightCollapse = false,
    fullBleed = false,
    simpleMobileBar = false,
    className,
}: LearnShellProps) => {
    // the reader's bottom-tab bar only fits a content-map left rail; other left rails use the plain bar
    const useTabBar = Boolean(leftRail) && !simpleMobileBar
    return (
        // single column on mobile/tablet; a horizontal flow from lg up so the
        // content-map rail (left) and the optional right rail sit beside content
        <div className={cn("flex w-full flex-col items-start lg:flex-row", className)}>
            {/* desktop course-nav icon rail — sticks under the 4rem navbar, viewport-tall;
                the block owns its own scroll, divider, width animation + collapse. */}
            <aside className="hidden shrink-0 lg:sticky lg:top-16 lg:block lg:h-[calc(100dvh-4rem)]">
                <LearnSidebar />
            </aside>
            {/* persistent left content-map rail (course content tree) supplied by the layout */}
            {leftRail}
            {/* content column; the shell owns the canonical p-6 reading-column padding
                for every learn page (features supply only max-w + mx-auto + gap), except
                full-bleed routes (mind-map canvas). Also anchors the collapse handle +
                right border for the redux-driven (milestone) rail that opts into it */}
            <div className={cn("min-h-0 min-w-0 flex-1", !fullBleed && "p-6", useTabBar && "max-lg:pb-16", rightRail && "lg:pr-0 lg:pb-0", showRightCollapse && "relative lg:border-r")}>
                {showRightCollapse && <LearnPanelToggles />}
                {/* mobile chrome: the lesson reader (modules — has a left rail) folds
                    its 4 columns into a bottom-tab bar; other learn tabs (incl. a
                    non-reader left rail) keep the top drawer bar for course-nav. */}
                {useTabBar ? <LearnMobileTabBar /> : <LearnMobileBar />}
                {children}
            </div>
            {/* right rail supplied by the layout (on-this-page outline / milestone rail) */}
            {rightRail}
        </div>
    )
}

export default LearnShell
