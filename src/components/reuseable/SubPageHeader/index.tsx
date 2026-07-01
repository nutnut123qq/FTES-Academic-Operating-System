"use client"

import { ArrowLeft as ArrowLeftIcon } from "@gravity-ui/icons"
import React from "react"

import {
    useTranslations,
} from "next-intl"
import {
    Button,
} from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface SubPageHeaderProps extends WithClassNames<undefined> {
    /** Page title shown beside the back button. */
    title: string
    /** Optional subtitle; reserved height is three lines; longer text wraps then truncates. */
    description?: string
    /** Called when the back button is pressed. */
    onBack: () => void
    /** Accessible label for the back button (defaults to `common.back`). */
    backAriaLabel?: string
}

/**
 * Reusable sub-page header with back navigation, title, and optional description.
 *
 * @param props.title - Main heading text.
 * @param props.description - Muted subtitle; block keeps a fixed three-line height.
 * @param props.onBack - Back button handler (parent owns routing).
 * @param props.backAriaLabel - Override for back button aria-label.
 * @param props.className - Optional wrapper class.
 */
export const SubPageHeader = ({
    title,
    description,
    onBack,
    backAriaLabel,
    className,
}: SubPageHeaderProps) => {
    const t = useTranslations()

    return (
        <div className={className}>
            <div className="flex items-center gap-1.5">
                <Button
                    variant="ghost"
                    isIconOnly
                    aria-label={backAriaLabel ?? t("common.back")}
                    onPress={onBack}
                    className="shrink-0"
                >
                    <ArrowLeftIcon

                        className="size-6"
                    />
                </Button>
                <div className="min-w-0 flex-1">
                    <div className="text-2xl font-bold text-foreground">
                        {title}
                    </div>
                    {description !== undefined ? (
                        <div className="mt-1 text-sm text-muted line-clamp-3 overflow-hidden whitespace-normal break-words">
                            {description}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
