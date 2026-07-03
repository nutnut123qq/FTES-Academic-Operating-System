"use client"

import React, { useState } from "react"
import { Checkbox, Label, Skeleton, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"

/** Props for {@link TargetPanel}. */
export interface TargetPanelProps {
    /** Reference design image to rebuild. */
    targetImageUrl: string
    /** Requirement checklist items (from `challenge.requirements`). */
    requirements: Array<string>
    /** Self-ticked state per requirement (session-only, mock). */
    checked: Array<boolean>
    /** Toggle one requirement's tick. */
    onToggle: (index: number) => void
    className?: string
}

/**
 * Target panel of the UI/UX challenge editor: the reference design image
 * (skeleton while loading) + a self-tick requirement checklist the learner
 * uses to compare their build against the target.
 */
export const TargetPanel = ({
    targetImageUrl,
    requirements,
    checked,
    onToggle,
    className,
}: TargetPanelProps) => {
    const t = useTranslations("challenge")
    const [imageLoaded, setImageLoaded] = useState(false)
    const checkedCount = checked.filter(Boolean).length

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <Typography type="body-sm" weight="medium">
                {t("uiuxEditor.target.title")}
            </Typography>
            <div className="relative overflow-hidden rounded-2xl border border-separator">
                {!imageLoaded ? <Skeleton className="absolute inset-0" /> : null}
                {/* plain <img>: mock data-URI image, next/image optimization not applicable */}
                <img
                    src={targetImageUrl}
                    alt={t("uiuxEditor.target.alt")}
                    onLoad={() => setImageLoaded(true)}
                    className="block w-full"
                />
            </div>
            <div className="flex items-center justify-between gap-2">
                <Typography type="body-sm" weight="medium">
                    {t("uiuxEditor.target.checklist")}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("uiuxEditor.target.checked", {
                        checked: checkedCount,
                        total: requirements.length,
                    })}
                </Typography>
            </div>
            <div className="flex flex-col gap-2">
                {requirements.map((requirement, index) => (
                    <Checkbox
                        key={index}
                        id={`uiux-requirement-${index}`}
                        variant="secondary"
                        isSelected={checked[index] ?? false}
                        onChange={() => onToggle(index)}
                    >
                        <Checkbox.Control>
                            <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Content>
                            <Label htmlFor={`uiux-requirement-${index}`}>
                                <span className="text-sm text-foreground">{requirement}</span>
                            </Label>
                        </Checkbox.Content>
                    </Checkbox>
                ))}
            </div>
        </div>
    )
}
