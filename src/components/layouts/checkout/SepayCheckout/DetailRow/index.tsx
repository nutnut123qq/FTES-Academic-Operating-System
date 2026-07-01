"use client"

import { Copy } from "@gravity-ui/icons"
import React from "react"
import {
    Button,
    cn,
} from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link DetailRow}. */
export interface DetailRowProps extends WithClassNames<undefined> {
    /** Uppercase caption shown above the value. */
    label: string
    /** The value text rendered in the row. */
    value: string
    /** When true, render a copy-to-clipboard button. */
    showCopy?: boolean
    /** Text to copy when the button is pressed; falls back to `value`. */
    copyValue?: string
    /** When true, style the row as the primary/highlighted field. */
    isHighlighted?: boolean
    /** Copy handler invoked with the resolved text to copy. */
    onCopy?: (text: string) => void
}

/**
 * One label/value row in the SePay order summary, with optional copy button.
 *
 * Presentational (render-only): the container owns the clipboard logic and
 * passes it down via {@link DetailRowProps.onCopy}; `"use client"` only because
 * it renders the interactive HeroUI copy button.
 * @param props - the row label/value + copy + highlight flags
 */
export const DetailRow = ({
    label,
    value,
    showCopy = false,
    copyValue,
    isHighlighted = false,
    onCopy,
    className,
}: DetailRowProps) => {
    const textToCopy = copyValue ?? value
    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                {label}
            </span>
            <div
                className={`flex items-center justify-between rounded-xl border-1 p-3 ${
                    isHighlighted ? "border-primary/30 bg-primary/10" : "border-default-200 bg-default/40"
                }`}
            >
                <span
                    className={`font-mono ${isHighlighted ? "text-lg font-bold text-primary" : "text-sm"}`}
                >
                    {value}
                </span>
                {showCopy ? (
                    <Button
                        aria-label="Copy"
                        size="sm"
                        variant="ghost"
                        onPress={() => onCopy?.(textToCopy)}
                    >
                        <Copy className="h-5 w-5" />
                    </Button>
                ) : null}
            </div>
        </div>
    )
}
