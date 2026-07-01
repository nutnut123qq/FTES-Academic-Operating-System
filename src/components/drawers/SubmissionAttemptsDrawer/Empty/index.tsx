"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for the submission attempts empty state.
 */
export type EmptyProps = WithClassNames<undefined>

/**
 * Empty state when the submission attempts list has no rows.
 *
 * @param props - Optional `className` / `classNames` for layout.
 */
export const Empty = (props: EmptyProps) => {
    const { className } = props
    const t = useTranslations()
    return (
        <div className={cn("p-3 text-sm text-muted", className)}>
            {t("submissionAttempts.noAttempts")}
        </div>
    )
}
