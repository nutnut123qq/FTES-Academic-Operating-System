import React from "react"
import { Chip, cn, Typography } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link HeroBanner} block. */
export interface HeroBannerProps extends WithClassNames<undefined> {
    /** Eyebrow label (the audience/subject gate). */
    eyebrow: React.ReactNode
    /** Optional leading icon for the eyebrow chip. */
    eyebrowIcon?: React.ReactNode
    /** Headline — pass a rich node so the caller controls emphasis/strikethrough. */
    headline: React.ReactNode
    /** Supporting positioning line. */
    subline: React.ReactNode
    /** Primary CTA (a configured Button). */
    primary: React.ReactNode
    /** Optional secondary CTA. */
    secondary?: React.ReactNode
    /**
     * Optional brand-coloured keyword strip under the CTAs (e.g. supported languages),
     * rendered as `Chip`s. Each item carries a `className` (e.g. `bg-[hex]/10 text-[hex]`)
     * for its brand tint so the chip reads alive, not muted.
     */
    keywords?: ReadonlyArray<{ label: string; className: string }>
    /** Optional muted label before the keyword strip (e.g. "Solve in"). */
    keywordsLabel?: React.ReactNode
    /**
     * Optional visual anchor (e.g. a transparent hero image). When present the hero
     * switches to a SPLIT layout — text left, visual right (stacks on mobile: text
     * then visual). When absent the hero stays centered single-column (honest — no
     * fabricated visual).
     */
    visual?: React.ReactNode
}

/**
 * Opening hero for the public landing page. Two layouts driven by `visual`:
 * - **split** (visual present): text column (left-aligned) + visual column — the
 *   visual anchors the positioning. Stacks on mobile.
 * - **centered** (no visual): the original single-column statement.
 * One primary + one secondary CTA + optional keyword strip. Tier-3 block: owns all
 * styling, content via props (no i18n, no data).
 *
 * @param props - {@link HeroBannerProps}
 */
export const HeroBanner = ({
    eyebrow,
    eyebrowIcon,
    headline,
    subline,
    primary,
    secondary,
    keywords,
    keywordsLabel,
    visual,
    className,
}: HeroBannerProps) => {
    const hasVisual = Boolean(visual)
    const align = hasVisual ? "start" : "center"

    const textColumn = (
        <div
            className={cn(
                "flex flex-col gap-6",
                hasVisual ? "flex-1 items-start text-left" : "items-center text-center",
            )}
        >
            <Chip size="sm" className="bg-accent/10 text-accent">
                {eyebrowIcon}
                <Chip.Label>{eyebrow}</Chip.Label>
            </Chip>

            <Typography.Heading level={1} weight="bold" align={align} className="max-w-4xl">
                {headline}
            </Typography.Heading>

            <Typography type="body" color="muted" align={align} className="max-w-2xl whitespace-pre-line">
                {subline}
            </Typography>

            <div
                className={cn(
                    "flex flex-col items-stretch gap-3 sm:flex-row sm:items-center",
                    hasVisual ? "sm:justify-start" : "sm:justify-center",
                )}
            >
                {primary}
                {secondary}
            </div>

            {keywords && keywords.length > 0 ? (
                <div
                    className={cn(
                        "flex flex-wrap items-center gap-2",
                        hasVisual ? "justify-start" : "justify-center",
                    )}
                >
                    {keywordsLabel ? (
                        <Typography type="body-xs" color="muted">
                            {keywordsLabel}
                        </Typography>
                    ) : null}
                    {keywords.map((lang) => (
                        // brand-coloured chip — the language's official colour as a bg/10 + text tint
                        <Chip key={lang.label} size="sm" className={lang.className}>
                            <Chip.Label>{lang.label}</Chip.Label>
                        </Chip>
                    ))}
                </div>
            ) : null}
        </div>
    )

    if (!hasVisual) {
        return (
            <section className={cn("flex flex-col items-center gap-6 text-center", className)}>
                {textColumn}
            </section>
        )
    }

    return (
        <section className={cn("flex flex-col items-center gap-10 lg:flex-row lg:gap-12", className)}>
            {textColumn}
            <div className="flex w-full max-w-md shrink-0 items-center justify-center lg:max-w-none lg:flex-1">
                {visual}
            </div>
        </section>
    )
}
