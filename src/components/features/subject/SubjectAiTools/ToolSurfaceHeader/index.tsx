"use client"

import React from "react"
import { Button } from "@heroui/react"
import { ArrowLeftIcon } from "@phosphor-icons/react"

/** Props for {@link ToolSurfaceHeader}. */
export interface ToolSurfaceHeaderProps {
    /** Localized surface title (rendered as the focusable heading). */
    title: string
    /** Back handler — returns to the hub grid. */
    onBack: () => void
    /** Accessible label for the back button (localized). */
    backLabel: string
    /** Ref attached to the heading so callers can move focus on view entry. */
    headingRef?: React.Ref<HTMLHeadingElement>
    /** Optional trailing controls (e.g. conversations/settings triggers). */
    trailing?: React.ReactNode
}

/**
 * Shared in-panel surface header: a back button + focusable heading + optional
 * trailing controls. Used by every AI tool surface and secondary in-panel view so
 * back navigation and focus handling stay consistent.
 */
export const ToolSurfaceHeader = ({
    title,
    onBack,
    backLabel,
    headingRef,
    trailing,
}: ToolSurfaceHeaderProps) => {
    return (
        <div className="flex items-center gap-2">
            <Button
                size="sm"
                variant="tertiary"
                isIconOnly
                aria-label={backLabel}
                onPress={onBack}
            >
                <ArrowLeftIcon
                    className="size-5"
                    aria-hidden
                    focusable="false"
                />
            </Button>
            <h2
                ref={headingRef}
                tabIndex={-1}
                className="flex-1 text-lg font-bold outline-none"
            >
                {title}
            </h2>
            {trailing}
        </div>
    )
}
