"use client"

import React from "react"
import { Label, ListBox, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
    BookOpenIcon,
    FlagIcon,
    PuzzlePieceIcon,
    TrophyIcon,
} from "@phosphor-icons/react"
import type { Icon } from "@phosphor-icons/react"
import {
    CATEGORY_COLOR,
    categoryMyXp,
    parseCategoryParam,
    type LeaderboardCategoryKey,
} from "../categories"
import { useLeaderboardSwr } from "../useLeaderboardSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** One row in the category rail. */
interface RailItem {
    key: LeaderboardCategoryKey
    icon: Icon
    /** Inline colour for the icon (matches the row segment bar); accent for total. */
    color?: string
    label: string
    /** Viewer's XP in this category. */
    xp: number
    /** Optional muted caption ("9 bài · ×3" / "Sắp có"). */
    caption?: string
    disabled?: boolean
}

/** Props for {@link LeaderboardCategoryRail}. */
export interface LeaderboardCategoryRailProps extends WithClassNames<undefined> {
    /**
     * `rail` — the sidebar-style vertical list (desktop left rail, in the learn
     * shell's `leftRail` slot). `chips` — a horizontal scroll of pills above the
     * board (mobile, where the rail is hidden).
     */
    variant: "rail" | "chips"
}

/**
 * The XP-category selector — doubles as the viewer's XP composition (each row shows
 * *your* XP in that category) and the board's sort control. Self-contained: reads
 * the shared leaderboard fetch + drives the selection through the `?category=` URL
 * param, so it works from the left rail (a different layout slot than the board)
 * with no shared React state. `total` is the canonical ranking; `coding` is
 * disabled until the backend scores it per-course.
 *
 * @param props - {@link LeaderboardCategoryRailProps}
 */
export const LeaderboardCategoryRail = ({ variant, className }: LeaderboardCategoryRailProps) => {
    const t = useTranslations()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { data } = useLeaderboardSwr()
    const myRank = data?.myRank ?? null

    const selected = parseCategoryParam(searchParams.get("category"))
    const onSelect = (key: LeaderboardCategoryKey) => {
        // merge into the existing query (preserve other params, joined with `&`)
        const params = new URLSearchParams(searchParams.toString())
        params.set("category", key)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const items: Array<RailItem> = [
        {
            key: "total",
            icon: TrophyIcon,
            label: t("leaderboard.categories.total"),
            xp: categoryMyXp(myRank, "total"),
        },
        {
            key: "challenge",
            icon: PuzzlePieceIcon,
            color: CATEGORY_COLOR.challenge,
            label: t("leaderboard.categories.challenge"),
            xp: categoryMyXp(myRank, "challenge"),
            caption: t("leaderboard.categories.captionChallenge", { count: myRank?.completedChallenges ?? 0 }),
        },
        {
            key: "reading",
            icon: BookOpenIcon,
            color: CATEGORY_COLOR.reading,
            label: t("leaderboard.categories.reading"),
            xp: categoryMyXp(myRank, "reading"),
            caption: t("leaderboard.categories.captionReading", { count: myRank?.lessonsRead ?? 0 }),
        },
        {
            key: "milestone",
            icon: FlagIcon,
            color: CATEGORY_COLOR.milestone,
            label: t("leaderboard.categories.milestone"),
            xp: categoryMyXp(myRank, "milestone"),
            caption: t("leaderboard.categories.captionMilestone", { count: myRank?.milestoneProgress ?? 0 }),
        },
    ]

    // mobile: a horizontal scroll of category chips above the board
    if (variant === "chips") {
        return (
            <div className={cn("-mx-1 flex gap-2 overflow-x-auto px-1 pb-1", className)}>
                {items.map((item) => {
                    const isSelected = item.key === selected
                    return (
                        <button
                            key={item.key}
                            type="button"
                            disabled={item.disabled}
                            onClick={() => onSelect(item.key)}
                            className={cn(
                                "flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                                isSelected ? "border-accent bg-accent/10 text-accent" : "border-default text-muted hover:bg-default",
                                item.disabled && "cursor-not-allowed opacity-55",
                            )}
                        >
                            <item.icon
                                aria-hidden
                                focusable="false"
                                className={cn("size-4 shrink-0", isSelected && "text-accent")}
                                style={!isSelected && item.color ? { color: item.color } : undefined}
                            />
                            <span>{item.label}</span>
                            {!item.disabled ? (
                                <span className="font-medium">{t("leaderboard.xp", { xp: item.xp })}</span>
                            ) : null}
                        </button>
                    )
                })}
            </div>
        )
    }

    // desktop: vertical sidebar-style list (lives in the shell's left rail slot)
    return (
        <div className={cn("flex flex-col gap-3 overflow-y-auto p-6", className)}>
            <Label>{t("leaderboard.categories.label")}</Label>
            <ListBox
                aria-label={t("leaderboard.categories.label")}
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={[selected]}
                onSelectionChange={(keys) => {
                    // controlled single-select → drive the URL from the chosen key
                    const key = [...keys][0] as LeaderboardCategoryKey | undefined
                    if (key) {
                        onSelect(key)
                    }
                }}
                className="gap-1 p-0"
            >
                {items.map((item) => (
                    <ListBox.Item
                        key={item.key}
                        id={item.key}
                        textValue={item.label}
                        isDisabled={item.disabled}
                        className="cursor-pointer rounded-2xl px-3 py-2 data-[disabled=true]:cursor-not-allowed data-[hovered=true]:bg-default-100 data-[selected=true]:bg-accent/10 data-[disabled=true]:opacity-55"
                    >
                        <div className="flex items-center gap-3">
                            <item.icon
                                aria-hidden
                                focusable="false"
                                className={cn("size-5 shrink-0", !item.color && "text-accent")}
                                style={item.color ? { color: item.color } : undefined}
                            />
                            <div className="flex min-w-0 flex-1 flex-col gap-0">
                                <Typography type="body-sm" weight="medium" className="line-clamp-1">
                                    {item.label}
                                </Typography>
                                {item.caption ? (
                                    <Typography type="body-xs" color="muted" className="line-clamp-1">
                                        {item.caption}
                                    </Typography>
                                ) : null}
                            </div>
                            <Typography
                                type="body-sm"
                                weight="medium"
                                className={cn("shrink-0", item.key === selected ? "text-accent" : "text-muted")}
                            >
                                {item.disabled ? "—" : t("leaderboard.xp", { xp: item.xp })}
                            </Typography>
                        </div>
                    </ListBox.Item>
                ))}
            </ListBox>
        </div>
    )
}

export default LeaderboardCategoryRail
