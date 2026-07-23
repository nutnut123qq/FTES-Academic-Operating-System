"use client"

import React from "react"
import { Button, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    accentColor,
    type CvAccent,
    type CvDensity,
    type CvDesign,
    type CvFontChoice,
    CV_ACCENTS,
    CV_DENSITIES,
    CV_FONTS,
    CV_INK,
} from "./layout"

/** A labelled segmented control — one active option, keyboard + a11y friendly. */
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
        <div className="flex flex-col gap-1">
            <Typography type="body-xs" color="muted">
                {label}
            </Typography>
            <div
                role="group"
                aria-label={label}
                className="inline-flex flex-wrap gap-1 rounded-xl border border-default bg-surface p-1"
            >
                {options.map((option) => {
                    const active = option === value
                    return (
                        <Button
                            key={option}
                            size="sm"
                            variant={active ? "primary" : "tertiary"}
                            aria-pressed={active}
                            className={cn("min-w-0 px-2", !active && "bg-transparent")}
                            onPress={() => onChange(option)}
                        >
                            {renderOption(option)}
                        </Button>
                    )
                })}
            </div>
        </div>
    )

/** A small swatch for an accent option (a dot + its label). */
const AccentOption = ({ accent, label }: { accent: CvAccent; label: string }) => {
    const color = accentColor(accent)
    return (
        <span className="flex items-center gap-1.5">
            <span
                aria-hidden
                className="size-3 rounded-full border border-black/10"
                style={{
                    background: color ?? "transparent",
                    borderColor: color ? "transparent" : undefined,
                    ...(accent === "none" ? { backgroundImage: "linear-gradient(135deg,#fff 45%,#e11 45% 55%,#fff 55%)" } : {}),
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
    void CV_INK
    return (
        <div className="flex flex-wrap items-start gap-4 rounded-2xl border border-default bg-content1 px-4 py-3">
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
