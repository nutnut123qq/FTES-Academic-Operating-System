"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import { FileTextIcon } from "@phosphor-icons/react"

import type { SubjectAiSource } from "../../hooks/useQuerySubjectAiSourcesSwr"

/** Props for {@link SourcePicker}. */
export interface SourcePickerProps {
    /** Localized group label. */
    label: string
    /** Selectable sources. */
    sources: Array<SubjectAiSource>
    /** Currently selected source id, or null. */
    selectedId: string | null
    /** Fired when a source is picked. */
    onSelect: (id: string) => void
}

/**
 * Accessible single-select source list (resources/lessons) for the AI generators.
 * A `radiogroup` of pressable rows — the picked source drives generation.
 */
export const SourcePicker = ({
    label,
    sources,
    selectedId,
    onSelect,
}: SourcePickerProps) => {
    return (
        <div className="flex flex-col gap-2">
            <Typography type="body-sm" weight="medium" color="muted">
                {label}
            </Typography>
            <div
                role="radiogroup"
                aria-label={label}
                className="flex flex-col gap-2"
            >
                {sources.map((source) => {
                    const isSelected = selectedId === source.id
                    return (
                        <button
                            key={source.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => onSelect(source.id)}
                            className={cn(
                                "flex items-center gap-2 rounded-large border p-3 text-left outline-none transition-colors",
                                "focus-visible:ring-2 focus-visible:ring-focus",
                                isSelected
                                    ? "border-accent bg-accent/10 text-accent"
                                    : "border-default text-foreground hover:bg-default",
                            )}
                        >
                            <FileTextIcon
                                className="size-5 shrink-0"
                                aria-hidden
                                focusable="false"
                            />
                            <span className="min-w-0 flex-1 truncate text-sm">
                                {source.title}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
