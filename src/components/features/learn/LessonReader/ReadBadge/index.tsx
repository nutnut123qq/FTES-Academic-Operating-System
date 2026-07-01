"use client"

import { CheckCircleIcon } from "@phosphor-icons/react"
import React from "react"
import { Chip, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { ChipProps } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useAppSelector } from "@/redux/hooks"

/**
 * Props for {@link ReadBadge}.
 */
export interface ReadBadgeProps extends WithClassNames<undefined> {
    /** Chip size — defaults to `"md"`. */
    size?: ChipProps["size"]
}

/**
 * Green "Đã đọc" badge driven by `state.content.isRead` from Redux.
 * Returns `null` when the active content is not yet marked as read.
 */
export const ReadBadge = ({ size, className }: ReadBadgeProps) => {
    const t = useTranslations()
    const isRead = useAppSelector((state) => state.content.isRead)

    if (!isRead) return null

    return (
        <Chip variant="secondary" color="success" size={size} className={cn("bg-success/10 text-success", className)}>
            <CheckCircleIcon className="size-5" />
            <Chip.Label>{t("content.read")}</Chip.Label>
        </Chip>
    )
}
