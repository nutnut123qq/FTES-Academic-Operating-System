"use client"

import React from "react"
import { Label, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    GraduationCapIcon,
    CardsIcon,
    CodeIcon,
    TrophyIcon,
    GiftIcon,
    type Icon,
} from "@phosphor-icons/react"
import { useRouter } from "@/i18n/navigation"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link QuickActions}. */
export type QuickActionsProps = WithClassNames<undefined>

/** One shortcut row: icon + i18n label key + destination. */
interface QuickAction {
    key: string
    Icon: Icon
    href: string
}

/** The shortcut rows, ordered by everyday frequency (static, no data). */
const ACTIONS: Array<QuickAction> = [
    { key: "courses", Icon: GraduationCapIcon, href: "/courses" },
    { key: "review", Icon: CardsIcon, href: "/subjects" },
    { key: "practice", Icon: CodeIcon, href: "/challenges" },
    { key: "league", Icon: TrophyIcon, href: "/leaderboard" },
    { key: "rewards", Icon: GiftIcon, href: "/wallet" },
]

/**
 * Left-rail "quick actions" list — one-tap navigational shortcuts to the surfaces
 * a learner reaches for most. Pure navigation (static rows, no data). Rows are
 * flush-left, aligned with the heading; hover underlines the label (go-there).
 * @param props - optional root class name (placement only)
 */
export const QuickActions = ({ className }: QuickActionsProps) => {
    const t = useTranslations("analytics")
    const router = useRouter()

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <Label>{t("overview.quickActions")}</Label>
            <div className="flex flex-col">
                {ACTIONS.map(({ key, Icon, href }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => router.push(href)}
                        className="group flex w-full cursor-pointer items-center gap-3 py-2 text-left"
                    >
                        <Icon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                        <span className="truncate text-sm transition-colors group-hover:text-foreground group-hover:underline">
                            {t(`overview.actions.${key}`)}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
}
