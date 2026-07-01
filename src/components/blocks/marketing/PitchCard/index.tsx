import React from "react"
import { cn, Typography } from "@heroui/react"
import { IconTile } from "../../identity/IconTile"
import type { IconTileTone } from "../../identity/IconTile"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { SectionCard } from "@/components/reuseable/SectionCard"

/** Props for the {@link PitchCard} block. */
export interface PitchCardProps extends WithClassNames<undefined> {
    /** Phosphor icon node rendered inside the tinted {@link IconTile}. */
    icon: React.ReactNode
    /** Tint of the icon tile; defaults to accent. */
    tone?: IconTileTone
    /** Card title (the claim). */
    title: React.ReactNode
    /** Supporting body copy (the proof / explanation). */
    body: React.ReactNode
    /** Optional footer slot — e.g. a Link/Button into the relevant surface. */
    footer?: React.ReactNode
}

/**
 * A single "pitch" card: tinted icon tile, a bold claim, supporting copy, and an
 * optional footer action. Tier-3 presentational block built on {@link SectionCard}
 * — owns all styling, content via props. Reused across the wedge / outcome /
 * methodology beats of the landing page.
 *
 * @param props - {@link PitchCardProps}
 */
export const PitchCard = ({
    icon,
    tone = "accent",
    title,
    body,
    footer,
    className,
}: PitchCardProps) => {
    return (
        <SectionCard className={cn("h-full", className)} contentClassName="flex flex-col gap-3 h-full">
            <IconTile icon={icon} tone={tone} size="md" />
            <Typography type="h5" weight="semibold">
                {title}
            </Typography>
            <Typography type="body-sm" color="muted" className="flex-1">
                {body}
            </Typography>
            {footer ? <div>{footer}</div> : null}
        </SectionCard>
    )
}
