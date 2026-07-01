"use client"

import { Sparkles as SparkleIcon } from "@gravity-ui/icons"
import React from "react"
import {
    Chip,
    cn,
} from "@heroui/react"
import {

    useTranslations,
} from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"

export type StarCiAIBadgeProps = WithClassNames<{
    /** Extra classes on the sparkle icon (default `size-5`). */
    icon?: string
}>

/**
 * Compact "StarCi AI" label with accent chip styling (sparkle + translated brand).
 * @param props - {@link StarCiAIBadgeProps}
 */
export const StarCiAIBadge = (props: StarCiAIBadgeProps) => {
    const {
        className,
        classNames,
    } = props
    const t = useTranslations()
    return (
        <Chip
            className={cn(className)}
            color="accent"
            variant="secondary"
        >
            <SparkleIcon className={cn("size-5 shrink-0", classNames?.icon)} />
            <Chip.Label>{t("cv.submission.aiBrand")}</Chip.Label>
        </Chip>
    )
}
