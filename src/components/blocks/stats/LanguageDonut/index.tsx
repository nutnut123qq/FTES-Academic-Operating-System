"use client"

import React, {
    useMemo,
} from "react"
import {
    cn,
    Typography,
} from "@heroui/react"
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
import { getLanguageColor, getLanguageLabel } from "@/modules/utils/language"

/** One language slice: its key + count. */
export interface LanguageDonutItem {
    /** Language enum value (drives colour + label). */
    key: string
    /** Count for this language (slice size). */
    value: number
}

/** Props for {@link LanguageDonut}. */
export interface LanguageDonutProps extends WithClassNames<undefined> {
    /** Language buckets to plot. */
    items: Array<LanguageDonutItem>
    /** Centre big-number unit label (e.g. "solved" / "bài"). */
    unitLabel: string
    /** Accessible description of the donut. */
    ariaLabel: string
    /** Donut diameter in px. Defaults to 128. */
    size?: number
    /** Ring thickness in px (outer − inner radius). Defaults to 8 (matches a bar). */
    thickness?: number
}

/**
 * GitHub-style language-mix donut — a recharts ring split by language (brand
 * colours via {@link getLanguageColor}), a centred total, and a colour-dot legend
 * with per-language count + share. Pure/props-only block; owns its look. Language
 * names use the shared display map (`csharp`→C#, `cpp`→C++).
 *
 * @param props - {@link LanguageDonutProps}
 */
export const LanguageDonut = ({
    items,
    unitLabel,
    ariaLabel,
    size = 128,
    thickness = 8,
    className,
}: LanguageDonutProps) => {
    // total across languages — denominator for the legend percentages
    const total = useMemo(
        () => items.reduce((sum, item) => sum + item.value, 0),
        [items],
    )

    if (items.length === 0 || total === 0) {
        return null
    }

    // exact px radii → a ring of precisely `thickness` px
    const outerRadius = size / 2
    const innerRadius = Math.max(0, outerRadius - thickness)

    return (
        <div className={cn("flex flex-col items-center gap-6 sm:flex-row", className)}>
            {/* the donut — labelled as an image for screen readers */}
            <div
                role="img"
                aria-label={ariaLabel}
                style={{ width: size, height: size }}
                className="relative shrink-0"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip
                            formatter={(value, name) => [
                                `${value}`,
                                getLanguageLabel(String(name)),
                            ]}
                        />
                        <Pie
                            data={items}
                            dataKey="value"
                            nameKey="key"
                            innerRadius={innerRadius}
                            outerRadius={outerRadius}
                            paddingAngle={2}
                            stroke="none"
                        >
                            {items.map((item) => (
                                <Cell
                                    key={item.key}
                                    fill={getLanguageColor(item.key)}
                                    aria-hidden
                                    focusable="false"
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                {/* centre total */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0">
                    <Typography type="h3" weight="semibold">{total}</Typography>
                    <Typography type="body-xs" color="muted">{unitLabel}</Typography>
                </div>
            </div>

            {/* colour-coded legend with per-language count + share */}
            <div className="flex w-full flex-col gap-3">
                {items.map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                        <span
                            aria-hidden
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: getLanguageColor(item.key) }}
                        />
                        <Typography type="body-xs" color="muted" className="flex-1">
                            {getLanguageLabel(item.key)}
                        </Typography>
                        <Typography type="body-xs" color="muted">{item.value}</Typography>
                        <Typography type="body-xs" color="muted" className="w-10 shrink-0 text-right">
                            {Math.round((item.value / total) * 100)}%
                        </Typography>
                    </div>
                ))}
            </div>
        </div>
    )
}
