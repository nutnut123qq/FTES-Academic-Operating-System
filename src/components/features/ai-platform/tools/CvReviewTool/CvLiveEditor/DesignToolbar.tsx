"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { SegmentedControl } from "@/components/blocks/navigation/SegmentedControl"
import {
    accentColor,
    type CvAccent,
    type CvDensity,
    type CvDesign,
    type CvFontChoice,
    CV_ACCENTS,
    CV_DENSITIES,
    CV_FONTS,
} from "./layout"

/** A labelled segmented control — the house `SegmentedControl` block owns the look. */
const Segmented = <T extends string>({
    label,
    options,
    value,
    onChange,
    renderOption,
}: {
    label: string
    options: readonly T[]
    value: T
    onChange: (next: T) => void
    renderOption: (option: T) => React.ReactNode
}) => (
        <div className="flex flex-col gap-2">
            <Typography type="body-xs" color="muted">
                {label}
            </Typography>
            <SegmentedControl<T>
                className="w-fit"
                ariaLabel={label}
                items={options.map((option) => ({ value: option, label: renderOption(option) }))}
                value={value}
                onChange={onChange}
            />
        </div>
    )

/** A small swatch for an accent option (a dot + its label). */
const AccentOption = ({ accent, label }: { accent: CvAccent; label: string }) => {
    const color = accentColor(accent)
    return (
        <span className="flex items-center gap-2">
            <span
                aria-hidden
                className="size-3 rounded-full border border-default bg-surface"
                style={{
                    background: color ?? undefined,
                    borderColor: color ? "transparent" : undefined,
                    ...(accent === "none"
                        ? { backgroundImage: "linear-gradient(135deg, transparent 45%, var(--danger) 45% 55%, transparent 55%)" }
                        : {}),
                }}
            />
            <span>{label}</span>
        </span>
    )
}

export interface DesignToolbarProps {
    design: CvDesign
    onAccent: (accent: CvAccent) => void
    onDensity: (density: CvDensity) => void
    onFont: (font: CvFontChoice) => void
}

/**
 * Top design toolbar: accent (name + heading-rule tint), density (spacing /
 * line-height / font-size), and body font (serif / sans). Every knob is
 * persisted to localStorage by the parent and applied to BOTH the A4 preview and
 * the exported PDF via the shared `layout.ts` helpers.
 */
export const DesignToolbar = ({ design, onAccent, onDensity, onFont }: DesignToolbarProps) => {
    const t = useTranslations("aiPlatform.toolPages.cvReview.design")
    return (
        <div className="flex flex-wrap items-start gap-4 rounded-2xl border border-default bg-surface px-4 py-3">
            <Segmented<CvAccent>
                label={t("accent")}
                options={CV_ACCENTS}
                value={design.accent}
                onChange={onAccent}
                renderOption={(accent) => <AccentOption accent={accent} label={t(`accents.${accent}`)} />}
            />
            <Segmented<CvDensity>
                label={t("density")}
                options={CV_DENSITIES}
                value={design.density}
                onChange={onDensity}
                renderOption={(density) => t(`densities.${density}`)}
            />
            <Segmented<CvFontChoice>
                label={t("font")}
                options={CV_FONTS}
                value={design.font}
                onChange={onFont}
                renderOption={(font) => (
                    <span className={font === "serif" ? "font-serif" : "font-sans"}>{t(`fonts.${font}`)}</span>
                )}
            />
        </div>
    )
}
