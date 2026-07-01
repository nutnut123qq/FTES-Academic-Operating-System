import React from "react"
import { cn, Typography } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { SectionCard } from "@/components/reuseable/SectionCard"

/**
 * Props for the {@link MetricCard} block.
 *
 * A standalone metric card that presents a single data point with an optional
 * leading icon, a large value, a descriptive label, and an optional hint note.
 * Tier-3 presentational — all content arrives via props; no store, no fetch.
 */
export interface MetricCardProps extends WithClassNames<undefined> {
    /**
     * Optional leading icon rendered above the value row.
     * Pass an inline SVG or icon component sized to fit (e.g. 20–24 px).
     */
    icon?: React.ReactNode
    /**
     * The primary metric value to highlight (e.g. "1,204", "98%", a ReactNode
     * counter). Rendered at `text-2xl font-medium text-foreground`.
     */
    value: React.ReactNode
    /**
     * Short description of what the value measures (e.g. "Total Enrollments",
     * "Completion Rate"). Rendered at `text-xs text-muted` beneath the value.
     */
    label: React.ReactNode
    /**
     * Optional supplementary note rendered below the label in the same muted
     * tone — useful for context such as "vs. last week" or "updated daily".
     */
    hint?: React.ReactNode
}

/**
 * MetricCard is a standalone, framed metric display block built on
 * {@link SectionCard}. It wraps a single data point — icon, value, label, and
 * an optional hint — in a vertical flex layout. Unlike {@link StatPair}, which
 * is frameless and intended for stat ribbons, MetricCard supplies its own card
 * frame and is suitable for dashboards, profile sidebars, or KPI grids.
 *
 * Tier-3 presentational block: props-only, no store, no SWR, no side-effects.
 *
 * @param props - {@link MetricCardProps}
 *
 * @example
 * <MetricCard
 *   icon={<ChartLine />}
 *   value="1,204"
 *   label="Total Enrollments"
 *   hint="Updated daily"
 * />
 */
export const MetricCard = ({
    icon,
    value,
    label,
    hint,
    className,
}: MetricCardProps) => {
    return (
        // SectionCard provides the framed card shell (border + bg + radius)
        <SectionCard className={cn(className)}>
            <div className="flex flex-col gap-2">
                {/* Optional leading icon row — only rendered when icon is provided */}
                {icon ? (
                    <div>
                        {icon}
                    </div>
                ) : null}

                {/* Primary metric value — large and visually prominent */}
                <Typography type="h4" weight="semibold">
                    {value}
                </Typography>

                {/* Descriptive label beneath the value */}
                <Typography type="body-xs" color="muted">
                    {label}
                </Typography>

                {/* Optional supplementary hint — smaller, same muted tone */}
                {hint ? (
                    <Typography type="body-xs" color="muted">
                        {hint}
                    </Typography>
                ) : null}
            </div>
        </SectionCard>
    )
}
