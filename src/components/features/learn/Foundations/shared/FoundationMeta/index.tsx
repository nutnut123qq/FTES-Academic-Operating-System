"use client"

import { Chip, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import React, { useMemo } from "react"
import type { FoundationEntity } from "@/modules/types/entities/foundation"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface FoundationMetaProps extends WithClassNames<undefined> {
    /** Foundation row to render metadata chips for. */
    foundation: FoundationEntity
    /** When true, shows the kind chip (external link, video, article). */
    showKind?: boolean
}

/**
 * Shared metadata row: kind, recommended badge, tags, and author attribution.
 * @param props.foundation - Foundation entity from API.
 * @param props.showKind - Whether to render the resource kind chip.
 */
export const FoundationMeta = ({
    foundation,
    showKind = true,
    className,
}: FoundationMetaProps) => {
    const t = useTranslations()

    const kindLabel = useMemo(
        () => t(`foundations.kind.${foundation.kind}`),
        [foundation.kind, t],
    )

    const tagChips = useMemo(() => {
        if (!foundation.tags?.length) {
            return []
        }
        return [...foundation.tags].sort((a, b) => a.sortIndex - b.sortIndex)
    }, [foundation.tags])

    const authorLabel = useMemo(() => {
        if (!foundation.author?.trim()) {
            return ""
        }
        return t("foundations.authorBy", { author: foundation.author })
    }, [foundation.author, t])

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <div className="flex flex-wrap items-center gap-2">
                {showKind ? (
                    <Chip size="sm" variant="secondary" color="accent">
                        <Chip.Label>{kindLabel}</Chip.Label>
                    </Chip>
                ) : null}
                {foundation.isRecommended ? (
                    <Chip size="sm" variant="secondary" color="success" className="bg-success/10 text-success">
                        <Chip.Label>{t("foundations.recommended")}</Chip.Label>
                    </Chip>
                ) : null}
                {tagChips.map((tag) => (
                    <Chip key={tag.id} size="sm" variant="tertiary">
                        <Chip.Label>{tag.value}</Chip.Label>
                    </Chip>
                ))}
            </div>
            {authorLabel ? (
                <Typography type="body-xs" color="muted">{authorLabel}</Typography>
            ) : null}
        </div>
    )
}
