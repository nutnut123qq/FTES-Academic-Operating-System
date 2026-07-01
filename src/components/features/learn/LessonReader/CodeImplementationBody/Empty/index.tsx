"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

export type CodeImplementationEmptyProps = WithClassNames<undefined>

/**
 * Empty state when the lesson has no implementation guides.
 */
export const CodeImplementationEmpty = ({ className }: CodeImplementationEmptyProps) => {
    const t = useTranslations()

    return (
        <p className={cn("text-sm text-muted", className)}>
            {t("content.codeImplementation.empty")}
        </p>
    )
}
