import React from "react"
import { Chip, cn, Typography } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link SectionHeading} block. */
export interface SectionHeadingProps extends WithClassNames<undefined> {
    /** Small accent chip above the title (e.g. "Học thật"); omit to hide. */
    eyebrow?: React.ReactNode
    /** Section title. */
    title: React.ReactNode
    /** Optional supporting line under the title. */
    intro?: React.ReactNode
    /** Heading level — defaults to 3 (matches the app's PageHeader); pass 2 for a hero-scale moment. */
    level?: 2 | 3
    /** Text alignment; defaults to centered (marketing sections). */
    align?: "start" | "center"
    /** When set, renders a "#" deep-link next to the title (→ `#${anchorId}`) so each
     * section is referenceable. The section wrapper must carry that `id` + a `scroll-mt-*`. */
    anchorId?: string
}

/**
 * Marketing section heading: an optional accent eyebrow chip, a bold title, and
 * an optional muted intro line. Tier-3 presentational block — owns its own type
 * scale and spacing so feature code stays style-free. Text arrives via props
 * (no i18n inside the block).
 *
 * @param props - {@link SectionHeadingProps}
 */
export const SectionHeading = ({
    eyebrow,
    title,
    intro,
    level = 3,
    align = "center",
    anchorId,
    className,
}: SectionHeadingProps) => {
    const centered = align === "center"
    return (
        <div
            className={cn(
                "flex flex-col gap-3",
                centered ? "items-center" : "items-start",
                className,
            )}
        >
            {eyebrow ? (
                <Chip variant="soft" color="accent" size="sm">
                    <Chip.Label>{eyebrow}</Chip.Label>
                </Chip>
            ) : null}
            <div className={cn("flex items-center gap-2", centered && "justify-center")}>
                <Typography.Heading
                    level={level}
                    weight="bold"
                    align={centered ? "center" : "start"}
                >
                    {title}
                </Typography.Heading>
                {anchorId ? (
                    // "#" deep-link to this section (ref-able). Quiet by default, accent on hover.
                    <a
                        href={`#${anchorId}`}
                        aria-label={`#${anchorId}`}
                        className="text-xl leading-none text-muted opacity-50 transition hover:text-accent hover:opacity-100"
                    >
                        #
                    </a>
                ) : null}
            </div>
            {intro ? (
                <Typography
                    type="body-sm"
                    color="muted"
                    align={centered ? "center" : "start"}
                    className="max-w-2xl"
                >
                    {intro}
                </Typography>
            ) : null}
        </div>
    )
}
