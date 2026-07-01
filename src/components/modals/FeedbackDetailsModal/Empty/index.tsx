"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link FeedbackDetailsEmpty}.
 */
export type FeedbackDetailsEmptyProps = WithClassNames<undefined>

/**
 * Empty state for feedback details list.
 *
 * @param props - Optional styling props.
 */
export const FeedbackDetailsEmpty = (props: FeedbackDetailsEmptyProps) => {
    const { className } = props
    const t = useTranslations()
    return (
        <div className={cn("p-3 text-sm text-muted", className)}>
            {t("feedback.empty")}
        </div>
    )
}

