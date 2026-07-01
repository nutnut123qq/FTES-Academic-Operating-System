"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

export type CodeExplainingEmptyProps = WithClassNames<undefined>

/**
 * Empty state when the lesson has no code explaining rows.
 */
export const CodeExplainingEmpty = ({ className }: CodeExplainingEmptyProps) => {
    const t = useTranslations()

    return (
        <p className={cn("text-sm text-muted", className)}>
            {t("content.codeExplainings.empty")}
        </p>
    )
}
