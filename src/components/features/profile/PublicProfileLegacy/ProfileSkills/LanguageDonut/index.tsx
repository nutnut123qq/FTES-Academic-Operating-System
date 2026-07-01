"use client"

import React, {
    useMemo,
} from "react"
import {
    cn,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import type { QueryUserCodingSkillCount } from "@/modules/api/graphql/queries/types/user-coding-skills"

/** Props for {@link LanguageDonut}. */
export interface LanguageDonutProps extends WithClassNames<undefined> {
    /** Solved-count buckets, one per language (key = language value). */
    items: Array<QueryUserCodingSkillCount>
}

/** Brand-ish colour per language so the dev's language mix reads at a glance. */
const LANGUAGE_COLORS: Record<string, string> = {
    typescript: "#3178c6",
    javascript: "#f7df1e",
    python: "#3776ab",
    java: "#e76f00",
    cpp: "#00599c",
    go: "#00add8",
    csharp: "#9b4f96",
    rust: "#dea584",
    kotlin: "#a97bff",
    php: "#777bb4",
    ruby: "#cc342d",
}

/** Fallback palette for languages without a dedicated brand colour. */
const FALLBACK_COLORS = [
    "#6366f1",
    "#ec4899",
    "#14b8a6",
    "#f59e0b",
    "#8b5cf6",
]

/** Title-case a language key for display. */
const labelOf = (key: string): string => key.charAt(0).toUpperCase() + key.slice(1)

/** Resolve a slice colour: the brand colour, else a stable fallback by index. */
const colorOf = (key: string, index: number): string =>
    LANGUAGE_COLORS[key] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]

/**
 * Language-mix donut — the dev's solved problems split by language, read as
 * *depth per language* (each language's share of solved work), not a count flex.
 * A recharts donut on the left, a colour-coded legend with per-language share on
 * the right; the centre shows the total solved problems. Presentational:
 * receives its buckets as a prop.
 *
 * @param props - {@link LanguageDonutProps}
 */
export const LanguageDonut = ({
    items,
    className,
}: LanguageDonutProps) => {
    const t = useTranslations()

    // total solved across languages — denominator for the legend percentages
    const total = useMemo(
        () => items.reduce((sum, item) => sum + item.solved, 0),
        [items],
    )

    // nothing to plot
    if (items.length === 0 || total === 0) {
        return null
    }

    return (
        <div className={cn("flex flex-col items-center gap-6 sm:flex-row", className)}>
            {/* the donut — labelled as an image for screen readers */}
            <div
                role="img"
                aria-label={t("publicProfile.skills.languageDonutAria")}
                className="relative h-44 w-44 shrink-0"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip
                            formatter={(value, name) => [
                                `${value}`,
                                labelOf(String(name)),
                            ]}
                        />
                        <Pie
                            data={items}
                            dataKey="solved"
                            nameKey="key"
                            innerRadius="62%"
                            outerRadius="100%"
                            paddingAngle={2}
                            stroke="none"
                        >
                            {items.map((item, index) => (
                                <Cell
                                    key={item.key}
                                    fill={colorOf(item.key, index)}
                                    aria-hidden
                                    focusable="false"
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                {/* centre total (solved problems — depth, not language breadth) */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0">
                    <Typography type="h3" weight="semibold">{total}</Typography>
                    <Typography type="body-xs" color="muted">
                        {t("publicProfile.skills.solvedUnit")}
                    </Typography>
                </div>
            </div>

            {/* colour-coded legend with per-language share (depth) */}
            <div className="flex w-full flex-col gap-3">
                {items.map((item, index) => (
                    <div
                        key={item.key}
                        className="flex items-center gap-2"
                    >
                        <span
                            aria-hidden
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: colorOf(item.key, index) }}
                        />
                        <Typography type="body-sm" className="flex-1">{labelOf(item.key)}</Typography>
                        <Typography type="body-xs" color="muted">{item.solved}</Typography>
                        <Typography type="body-xs" color="muted" className="w-10 shrink-0 text-right">
                            {Math.round((item.solved / total) * 100)}%
                        </Typography>
                    </div>
                ))}
            </div>
        </div>
    )
}
