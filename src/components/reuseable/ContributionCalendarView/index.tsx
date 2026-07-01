"use client"

import React, {
    useMemo,
    useRef,
    useState,
} from "react"
import {
    motion,
} from "framer-motion"
import {
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import type { QueryMyContributionDayData } from "@/modules/api/graphql/queries/types/my-dashboard"

/** Props for {@link ContributionCalendarView}. */
export interface ContributionCalendarViewProps extends WithClassNames<undefined> {
    /** Active contribution days for the selected year (oldest first). */
    days: Array<QueryMyContributionDayData>
    /** The year currently shown. */
    year: number
    /** Called with the picked year when the user flips the year switcher. */
    onYearChange: (year: number) => void
}

/** One rendered cell of the calendar grid. */
interface HeatmapCell {
    /** Calendar day, `YYYY-MM-DD`. */
    dateStr: string
    /** Whether the day falls inside the selected year (off-year pad cells are blank). */
    inYear: boolean
    /** Total contributions that day (0 when none). */
    total: number
    /** Lessons/contents read that day. */
    contents: number
    /** Challenges passed that day. */
    challenges: number
    /** Milestone tasks passed that day. */
    milestones: number
}

/**
 * Fill per intensity level (0 = none → 4 = most). Theme-aware brand-pink ramp via
 * the `--heat-*` tokens (globals.css): 0 = empty track, 1→4 = rising activity,
 * with a distinct light/dark palette each so levels stay legible in both modes.
 */
const LEVEL_CLASS = [
    "bg-[var(--heat-0)]",
    "bg-[var(--heat-1)]",
    "bg-[var(--heat-2)]",
    "bg-[var(--heat-3)]",
    "bg-[var(--heat-4)]",
]

/** How many recent years the selector offers (current + 2 back). */
const YEAR_SPAN = 3

/**
 * Maps a day's total to an intensity level (0–4) for the cell colour.
 * @param total - the day's contribution count.
 * @returns the intensity bucket index.
 */
const levelOf = (total: number): number => {
    // no activity → the empty track colour
    if (total <= 0) {
        return 0
    }
    // fixed buckets keep the scale stable across users (not relative to a max)
    if (total <= 2) {
        return 1
    }
    if (total <= 5) {
        return 2
    }
    if (total <= 9) {
        return 3
    }
    return 4
}

/**
 * Controlled, data-driven GitHub-style learning-activity heatmap — a 7-row ×
 * ~53-column grid coloured by daily contributions (contents read / challenges
 * passed / milestones), with a year switcher + legend + hover popover. Pure
 * presenter: the owner supplies the `days` + selected `year` and handles
 * `onYearChange` (so it works for both the signed-in viewer's dashboard and any
 * user's public profile). `"use client"` for i18n + hover state.
 *
 * @param props - {@link ContributionCalendarViewProps}
 */
export const ContributionCalendarView = ({
    days,
    year,
    onYearChange,
    className,
}: ContributionCalendarViewProps) => {
    const t = useTranslations()
    const locale = useLocale()

    /** Viewport box the draggable grid is constrained to (no native scroll). */
    const viewportRef = useRef<HTMLDivElement>(null)

    /** The hovered cell + its viewport anchor, driving the single shared popover. */
    const [hovered, setHovered] = useState<{
        cell: HeatmapCell
        x: number
        y: number
    } | null>(null)

    /** Recent years offered by the selector (current → current − (YEAR_SPAN−1)). */
    const years = useMemo(
        () => {
            const current = new Date().getFullYear()
            return Array.from({
                length: YEAR_SPAN,
            }).map((_, index) => current - index)
        },
        [],
    )

    /** Active-day lookup by date string (full breakdown for the hover popover). */
    const byDate = useMemo(
        () => {
            const map = new Map<string, QueryMyContributionDayData>()
            for (const day of days) {
                map.set(day.date,
                    day)
            }
            return map
        },
        [
            days,
        ],
    )

    /** Total contributions across the year (header count). */
    const totalCount = useMemo(
        () => days.reduce((sum, day) => sum + day.total,
            0),
        [
            days,
        ],
    )

    /** The year laid out as week columns (each a 7-day Sun→Sat array). */
    const weeks = useMemo<Array<Array<HeatmapCell>>>(
        () => {
            // align the grid start to the Sunday on/before Jan 1 (UTC, no TZ drift)
            const firstDay = new Date(Date.UTC(year,
                0,
                1))
            const cursor = new Date(firstDay)
            cursor.setUTCDate(firstDay.getUTCDate() - firstDay.getUTCDay())
            const lastDay = new Date(Date.UTC(year,
                11,
                31))
            const columns: Array<Array<HeatmapCell>> = []
            // walk week by week until the year is fully covered
            while (cursor <= lastDay) {
                const column: Array<HeatmapCell> = []
                for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
                    const dateStr = cursor.toISOString().slice(0,
                        10)
                    // the day's counts (defaults to an empty day when absent)
                    const day = byDate.get(dateStr)
                    column.push({
                        dateStr,
                        inYear: cursor.getUTCFullYear() === year,
                        total: day?.total ?? 0,
                        contents: day?.contents ?? 0,
                        challenges: day?.challenges ?? 0,
                        milestones: day?.milestones ?? 0,
                    })
                    cursor.setUTCDate(cursor.getUTCDate() + 1)
                }
                columns.push(column)
            }
            return columns
        },
        [
            year,
            byDate,
        ],
    )

    /** Short month label per week column (only at the week a new month starts). */
    const monthLabels = useMemo(
        () => weeks.map((column, index) => {
            // anchor on the first in-year day of the column
            const firstInYear = column.find((cell) => cell.inYear)
            if (!firstInYear) {
                return ""
            }
            const month = new Date(`${firstInYear.dateStr}T00:00:00Z`).getUTCMonth()
            // previous column's month, to detect a change
            const previous = weeks[index - 1]?.find((cell) => cell.inYear)
            const previousMonth = previous
                ? new Date(`${previous.dateStr}T00:00:00Z`).getUTCMonth()
                : -1
            if (month === previousMonth) {
                return ""
            }
            return new Date(Date.UTC(year,
                month,
                1)).toLocaleDateString(locale,
                {
                    month: "short",
                })
        }),
        [
            weeks,
            year,
            locale,
        ],
    )

    /** Weekday labels shown on the left (Mon / Wed / Fri rows). */
    const weekdayLabels = useMemo(
        () => [1,
            3,
            5].map((dayIndex) => ({
            dayIndex,
            // 2025-06-01 is a Sunday → +dayIndex lands on the wanted weekday
            label: new Date(Date.UTC(2025,
                5,
                1 + dayIndex)).toLocaleDateString(locale,
                {
                    weekday: "short",
                }),
        })),
        [
            locale,
        ],
    )

    return (
        <div className={cn("flex flex-col gap-3",
            className)}
        >
            {/* header: year-scoped count + the year switcher */}
            <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted">
                    {t("dashboard.contributions.title",
                        {
                            count: totalCount,
                            year,
                        })}
                </div>
                <div className="flex items-center gap-1.5">
                    {years.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onYearChange(option)}
                            className={cn(
                                "rounded-medium px-1.5 py-0.5 text-xs",
                                option === year
                                    ? "bg-primary/15 text-primary"
                                    : "text-muted hover:text-foreground",
                            )}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {/* draggable grid (≈53 columns can exceed the viewport): grab + pull
                horizontally instead of a native scrollbar. Framer constrains the
                motion track to the viewport box so it can't be flung off-edge. */}
            <div
                ref={viewportRef}
                className="cursor-grab overflow-hidden active:cursor-grabbing"
            >
                <motion.div
                    drag="x"
                    dragConstraints={viewportRef}
                    dragElastic={0.04}
                    dragMomentum={false}
                    className="flex w-max flex-col gap-1.5"
                >

                    {/* month labels aligned to the week columns */}
                    <div className="flex gap-[3px] pl-8">
                        {monthLabels.map((label, index) => (
                            <div
                                key={index}
                                className="w-3 shrink-0 whitespace-nowrap text-[10px] text-muted"
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-[3px]">
                        {/* weekday labels (Mon/Wed/Fri) */}
                        <div className="flex w-8 shrink-0 flex-col gap-[3px] pr-1">
                            {Array.from({
                                length: 7,
                            }).map((_, dayIndex) => {
                                const weekday = weekdayLabels.find(
                                    (entry) => entry.dayIndex === dayIndex,
                                )
                                return (
                                    <div
                                        key={dayIndex}
                                        className="h-3 text-right text-[10px] leading-3 text-muted"
                                    >
                                        {weekday?.label ?? ""}
                                    </div>
                                )
                            })}
                        </div>

                        {/* one column per week */}
                        {weeks.map((column, columnIndex) => (
                            <div
                                key={columnIndex}
                                className="flex shrink-0 flex-col gap-[3px]"
                            >
                                {column.map((cell) => (
                                    <div
                                        key={cell.dateStr}
                                        onMouseEnter={cell.inYear
                                            ? (event) => {
                                                // anchor the shared popover above this cell
                                                const rect = event.currentTarget.getBoundingClientRect()
                                                setHovered({
                                                    cell,
                                                    x: rect.left + rect.width / 2,
                                                    y: rect.top,
                                                })
                                            }
                                            : undefined}
                                        onMouseLeave={cell.inYear
                                            ? () => setHovered(null)
                                            : undefined}
                                        className={cn(
                                            "h-3 w-3 shrink-0 rounded-sm",
                                            cell.inYear ? LEVEL_CLASS[levelOf(cell.total)] : "bg-transparent",
                                        )}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* legend: Less → More */}
            <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted">
                <span>{t("dashboard.contributions.less")}</span>
                {LEVEL_CLASS.map((levelClass, index) => (
                    <span
                        key={index}
                        className={cn("h-3 w-3 shrink-0 rounded-sm",
                            levelClass)}
                    />
                ))}
                <span>{t("dashboard.contributions.more")}</span>
            </div>

            {/* single shared popover, anchored above the hovered cell */}
            {hovered ? (
                <div
                    style={{
                        position: "fixed",
                        left: hovered.x,
                        top: hovered.y - 8,
                        transform: "translate(-50%, -100%)",
                    }}
                    className="pointer-events-none z-50 flex flex-col gap-0 rounded-medium border border-default bg-surface px-2 py-1.5 text-xs shadow-lg"
                >
                    <span className="font-medium text-foreground">
                        {new Date(`${hovered.cell.dateStr}T00:00:00Z`).toLocaleDateString(locale)}
                    </span>
                    <span className="text-foreground">
                        {t("dashboard.contributions.cellTitle",
                            {
                                count: hovered.cell.total,
                            })}
                    </span>
                    {hovered.cell.total > 0 ? (
                        <span className="text-muted">
                            {t("dashboard.contributions.breakdown",
                                {
                                    contents: hovered.cell.contents,
                                    challenges: hovered.cell.challenges,
                                    milestones: hovered.cell.milestones,
                                })}
                        </span>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}
