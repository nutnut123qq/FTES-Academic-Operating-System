"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import {
    CardsIcon,
    CubeIcon,
    StackIcon,
    TreeStructureIcon,
    TrophyIcon,
} from "@phosphor-icons/react"
import type { Icon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import type { LearnNavSection } from "../../hooks/useQueryLearnCourseSwr"

/** Phosphor icon per nav-section key. */
const NAV_ICON: Record<string, Icon> = {
    "mind-map": TreeStructureIcon,
    content: StackIcon,
    foundations: CubeIcon,
    review: CardsIcon,
    leaderboard: TrophyIcon,
}

/** Props for {@link LearnNavRail}. */
export interface LearnNavRailProps {
    courseId: string
    sections: Array<LearnNavSection>
    /** The currently active section key (route-derived). */
    activeKey: string
}

/**
 * LEFT course menu of the 3-column learn shell — a compact vertical list of the
 * course's learning surfaces (Mind map / Modules / Foundations / Review /
 * Leaderboard). Each row links to its route; the active row is accent-tinted.
 *
 * ponytail: only Mind map / Modules (content) / Leaderboard have real routes in
 * this feature set; Foundations / Review link to `content` as placeholders until
 * those trees land. Section list + active key arrive via props (tier-3 block).
 */
export const LearnNavRail = ({ courseId, sections, activeKey }: LearnNavRailProps) => {
    const t = useTranslations("learn")

    /** Real routes; unbuilt surfaces fall back to the content dashboard. */
    const hrefFor = (key: string) => {
        if (key === "mind-map") {
            return `/courses/${courseId}/learn/mind-map`
        }
        if (key === "leaderboard") {
            return `/courses/${courseId}/learn/leaderboard`
        }
        return `/courses/${courseId}/learn/content`
    }

    return (
        <nav aria-label={t("nav.label")} className="flex flex-col gap-2">
            {sections.map((section) => {
                const NavIcon = NAV_ICON[section.icon] ?? StackIcon
                const isActive = section.key === activeKey
                return (
                    <Link
                        key={section.key}
                        href={hrefFor(section.key)}
                        className={cn(
                            "flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors",
                            isActive
                                ? "bg-accent/10 text-accent"
                                : "text-foreground hover:bg-default/60",
                        )}
                        aria-current={isActive ? "page" : undefined}
                    >
                        <NavIcon
                            aria-hidden
                            focusable="false"
                            weight={isActive ? "fill" : "regular"}
                            className="size-5 shrink-0"
                        />
                        <Typography type="body-sm" weight={isActive ? "semibold" : "medium"}>
                            {t(`nav.sections.${section.key}`)}
                        </Typography>
                    </Link>
                )
            })}
        </nav>
    )
}
