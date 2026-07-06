"use client"

import React, { useMemo } from "react"
import { Label, ListBox, Typography, cn } from "@heroui/react"
import {
    BookOpenIcon,
    FlagIcon,
    PuzzlePieceIcon,
    TrophyIcon,
} from "@phosphor-icons/react"
import type { Icon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
import { usePathname, useRouter } from "@/i18n/navigation"
import {
    CATEGORY_COLOR,
    LEADERBOARD_CATEGORIES,
    categoryMyXp,
    useQueryLearnLeaderboardSwr,
} from "../../hooks/useQueryLearnLeaderboardSwr"
import type { LeaderboardCategory } from "../../hooks/useQueryLearnLeaderboardSwr"

/** Phosphor icon per category. */
const CATEGORY_ICON: Record<LeaderboardCategory, Icon> = {
    total: TrophyIcon,
    challenges: PuzzlePieceIcon,
    reading: BookOpenIcon,
    milestones: FlagIcon,
}

/** Read the active category from the URL (defaults to "total"). */
export const parseCategoryParam = (param: string | null | undefined): LeaderboardCategory => {
    if (param && (LEADERBOARD_CATEGORIES as ReadonlyArray<string>).includes(param)) {
        return param as LeaderboardCategory
    }
    return "total"
}

/** Props for {@link LeaderboardCategoryRail}. */
export interface LeaderboardCategoryRailProps {
    /** "rail" = desktop sidebar list; "chips" = mobile horizontal chip strip. */
    variant: "rail" | "chips"
    className?: string
}

/**
 * LEFT category rail for the leaderboard (StarCI port). Selecting a category
 * re-ranks the board; the selection lives in the `?category=` URL param so it
 * survives reloads and is read by the board. Each row shows the viewer's XP in
 * that category, mirroring StarCI's "master-detail rail as filter".
 *
 * @param props - {@link LeaderboardCategoryRailProps}
 */
export const LeaderboardCategoryRail = ({ variant, className }: LeaderboardCategoryRailProps) => {
    const t = useTranslations("learn")
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { courseId } = useParams<{ courseId: string }>()
    const { myRank } = useQueryLearnLeaderboardSwr(courseId)

    const selected = parseCategoryParam(searchParams.get("category"))

    const onSelect = (key: LeaderboardCategory) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("category", key)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const items = useMemo(
        () =>
            LEADERBOARD_CATEGORIES.map((key) => ({
                key,
                icon: CATEGORY_ICON[key],
                color: key === "total" ? undefined : CATEGORY_COLOR[key],
                label: t(`leaderboard.categories.${key}`),
                xp: categoryMyXp(myRank, key),
            })),
        [t, myRank],
    )

    if (variant === "chips") {
        return (
            <div className={cn("-mx-1 flex gap-2 overflow-x-auto px-1 pb-1", className)}>
                {items.map((item) => {
                    const isSelected = item.key === selected
                    const CategoryIcon = item.icon
                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => onSelect(item.key)}
                            className={cn(
                                "flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                                isSelected
                                    ? "border-accent bg-accent/10 text-accent"
                                    : "border-default text-muted hover:bg-default",
                            )}
                        >
                            <CategoryIcon
                                aria-hidden
                                focusable="false"
                                className={cn("size-4 shrink-0", isSelected && "text-accent")}
                                style={!isSelected && item.color ? { color: item.color } : undefined}
                            />
                            <span>{item.label}</span>
                            <span className="font-medium">{t("leaderboard.xp", { value: item.xp })}</span>
                        </button>
                    )
                })}
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col gap-3 overflow-y-auto p-6", className)}>
            <Label>{t("leaderboard.categories.label")}</Label>
            <ListBox
                aria-label={t("leaderboard.categories.label")}
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={new Set([selected])}
                onSelectionChange={(keys) => {
                    if (keys === "all") {
                        return
                    }
                    const key = [...keys][0] as LeaderboardCategory | undefined
                    if (key) {
                        onSelect(key)
                    }
                }}
                className="gap-1 p-0"
            >
                {items.map((item) => {
                    const CategoryIcon = item.icon
                    return (
                        <ListBox.Item
                            key={item.key}
                            id={item.key}
                            textValue={item.label}
                            className="cursor-pointer rounded-2xl px-3 py-2 data-[hovered=true]:bg-default data-[selected=true]:bg-accent/10"
                        >
                            <div className="flex items-center gap-3">
                                <CategoryIcon
                                    aria-hidden
                                    focusable="false"
                                    className={cn("size-5 shrink-0", !item.color && "text-accent")}
                                    style={item.color ? { color: item.color } : undefined}
                                />
                                <Typography type="body-sm" weight="medium" className="line-clamp-1 min-w-0 flex-1">
                                    {item.label}
                                </Typography>
                                <Typography
                                    type="body-sm"
                                    weight="medium"
                                    className={cn("shrink-0", item.key === selected ? "text-accent" : "text-muted")}
                                >
                                    {t("leaderboard.xp", { value: item.xp })}
                                </Typography>
                            </div>
                        </ListBox.Item>
                    )
                })}
            </ListBox>
        </div>
    )
}

export default LeaderboardCategoryRail
