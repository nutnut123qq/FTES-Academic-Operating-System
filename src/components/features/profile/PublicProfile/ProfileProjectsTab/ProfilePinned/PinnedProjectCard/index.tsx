"use client"

import React from "react"
import {
    cn,
    Chip,
    Typography,
} from "@heroui/react"
import {
    ArrowSquareOutIcon,
    SealCheckIcon,
    GraduationCapIcon,
    CodeIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { QueryUserPinnedProjectItem } from "@/modules/api/graphql/queries/types/user-pinned-projects"

/** Tech-stack chips shown inline before collapsing the rest into a "+N" chip. */
const MAX_TECH_CHIPS = 3

/** Props for {@link PinnedProjectCard}. */
export interface PinnedProjectCardProps extends WithClassNames<undefined> {
    /** The pinned project to render (list-item data prop — store can't index it). */
    pin: QueryUserPinnedProjectItem
}

/**
 * Display-only card for one pinned project (public-profile showcase, GitHub-pinned
 * style). Reads as a credential when the capstone is verified: a type badge
 * (Capstone / Dự án) leads, the title links out (whole card is the outbound link),
 * a one-line description gives context, tech chips cap at {@link MAX_TECH_CHIPS}
 * with a "+N" overflow, and a verified course pin gets a success-toned border plus
 * a "Verified by StarCi" footer strip — the strongest trust signal.
 *
 * The owner's reorder/remove controls live in the manage modal (legacy card), so
 * this card is purely presentational: a `pin` in, an outbound link out.
 *
 * @param props - {@link PinnedProjectCardProps}
 */
export const PinnedProjectCard = ({ pin, className }: PinnedProjectCardProps) => {
    const t = useTranslations()

    const isCourse = pin.type === "course"
    const TypeIcon = isCourse ? GraduationCapIcon : CodeIcon
    const title = pin.title ?? t("pinnedProjects.untitled")

    const tech = pin.techStack ?? []
    const visibleTech = tech.slice(0, MAX_TECH_CHIPS)
    const overflow = tech.length - visibleTech.length

    const body = (
        <>
            <div className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                    {/* type badge — Capstone (success) vs Dự án (muted) */}
                    <span
                        className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
                            isCourse
                                ? "bg-success/10 text-success"
                                : "border border-default text-muted",
                        )}
                    >
                        <TypeIcon className="size-4" aria-hidden="true" focusable="false" />
                        {isCourse ? t("pinnedProjects.typeCapstone") : t("pinnedProjects.typeExternal")}
                    </span>
                    {/* outbound affordance */}
                    <ArrowSquareOutIcon
                        className="size-4 shrink-0 text-muted"
                        aria-hidden="true"
                        focusable="false"
                    />
                </div>
                <Typography
                    type="body-sm"
                    weight="medium"
                    className="line-clamp-2 group-hover:underline"
                >
                    {title}
                </Typography>
                {pin.description ? (
                    <Typography type="body-xs" color="muted" className="line-clamp-1">
                        {pin.description}
                    </Typography>
                ) : null}
                {visibleTech.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {visibleTech.map((techName) => (
                            <Chip key={techName} variant="soft" size="sm">
                                <Chip.Label>{techName}</Chip.Label>
                            </Chip>
                        ))}
                        {overflow > 0 ? (
                            <Chip variant="soft" size="sm">
                                <Chip.Label>{`+${overflow}`}</Chip.Label>
                            </Chip>
                        ) : null}
                    </div>
                ) : null}
            </div>
            {pin.isVerified ? (
                <div className="flex items-center gap-2 border-t border-success/30 bg-success/10 px-4 py-2">
                    <SealCheckIcon
                        className="size-4 shrink-0 text-success"
                        aria-hidden="true"
                        focusable="false"
                    />
                    <Typography type="body-xs" weight="medium" className="text-success">
                        {t("pinnedProjects.verifiedByStarci")}
                    </Typography>
                </div>
            ) : null}
        </>
    )

    // bounded surface card; verified pins read as a credential (success border)
    const cardClassName = cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-surface",
        pin.isVerified ? "border-success/40" : "border-default",
        className,
    )

    if (pin.url) {
        return (
            <a
                href={pin.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("pinnedProjects.openAria", { title })}
                className={cn(cardClassName, "cursor-pointer")}
            >
                {body}
            </a>
        )
    }

    return <div className={cardClassName}>{body}</div>
}
