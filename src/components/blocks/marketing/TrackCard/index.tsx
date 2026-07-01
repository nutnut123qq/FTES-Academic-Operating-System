import React from "react"
import { Card, CardContent, Typography, cn } from "@heroui/react"
import { ArrowRightIcon } from "@phosphor-icons/react"
import type { ReactNode } from "react"

/** Track accent — maps to a semantic theme token. */
export type TrackColor = "accent" | "success" | "warning"

/** One tier (rung) on a track's foundation→application path. */
export interface TrackTier {
    /** Tier name (eyebrow), e.g. "Foundation". */
    label: string
    /** What you learn at this tier, e.g. "HTTP, REST, data modeling". */
    topic: string
}

/** Props for {@link TrackCard}. */
export interface TrackCardProps {
    /** Leading icon (bare phosphor icon — tile sizes it). */
    icon: ReactNode
    /** Track title, e.g. "Fullstack thực chiến". */
    title: string
    /** Meta line, e.g. "23 module · 20 hệ thống". */
    meta: string
    /** Accent token driving dot / line / icon-tile / CTA colour. */
    color: TrackColor
    /** The 4 tiers, foundation → application (rendered as a vertical path). */
    tiers: ReadonlyArray<TrackTier>
    /** CTA label, e.g. "Vào khóa". */
    viewLabel: string
    /** CTA handler → navigate to the course. */
    onView: () => void
    /** Class on the outer card (sizing / placement). */
    className?: string
}

const DOT: Record<TrackColor, string> = { accent: "bg-accent", success: "bg-success", warning: "bg-warning" }
const LINE: Record<TrackColor, string> = { accent: "bg-accent/25", success: "bg-success/25", warning: "bg-warning/25" }
const TILE: Record<TrackColor, string> = {
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
}
const CTA: Record<TrackColor, string> = { accent: "text-accent", success: "text-success", warning: "text-warning" }

/**
 * A learning-track card for the landing "Lộ trình" section: identity header
 * (icon tile + title + meta) over a vertical 4-tier path (foundation →
 * application, each rung = coloured dot + tier eyebrow + topic) with a "Vào khóa"
 * CTA pinned to the bottom. Self-contained bounded object — render 3 side-by-side
 * (`md:grid-cols-3 gap-6`) so the tracks read + compare without a shared-axis
 * matrix. Colour comes from one semantic token via {@link TrackColor}.
 *
 * @param props - {@link TrackCardProps}
 */
export const TrackCard = ({ icon, title, meta, color, tiers, viewLabel, onView, className }: TrackCardProps) => (
    <Card className={cn("h-full", className)}>
        <CardContent className="flex h-full flex-col gap-6">
            <div className="flex items-center gap-3">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl [&>svg]:size-5", TILE[color])}>
                    {icon}
                </span>
                <div className="flex min-w-0 flex-col">
                    <Typography type="body" weight="semibold" className="truncate">
                        {title}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {meta}
                    </Typography>
                </div>
            </div>

            <div className="flex flex-col">
                {tiers.map((tier, index) => (
                    <div key={tier.label} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", DOT[color])} />
                            {index < tiers.length - 1 ? <span className={cn("my-1 w-px flex-1", LINE[color])} /> : null}
                        </div>
                        <div className={cn("flex flex-col gap-0.5", index < tiers.length - 1 && "pb-4")}>
                            <Typography type="body-xs" color="muted">
                                {tier.label}
                            </Typography>
                            <Typography type="body-sm">
                                {tier.topic}
                            </Typography>
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={onView}
                className={cn("group mt-auto inline-flex cursor-pointer items-center gap-1 self-start text-sm font-medium", CTA[color])}
            >
                {viewLabel}
                <ArrowRightIcon aria-hidden focusable="false" className="size-5 transition-transform group-hover:translate-x-0.5" />
            </button>
        </CardContent>
    </Card>
)
