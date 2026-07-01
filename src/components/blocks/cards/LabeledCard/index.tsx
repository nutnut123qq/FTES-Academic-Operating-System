import React from "react"
import type { ReactNode } from "react"
import { Card, CardContent, Label, Link, cn } from "@heroui/react"
import { CaretRightIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link LabeledCard} block. */
export interface LabeledCardProps extends WithClassNames<undefined> {
    /** Section title rendered OUTSIDE (above) the card. */
    label: ReactNode
    /** Optional leading icon shown before the label. */
    icon?: ReactNode
    /**
     * Optional secondary label pinned to the RIGHT of the label row (muted) — a
     * passive tag, NOT an action (e.g. a currency "VND", a count, a unit). Rendered
     * only when neither `action` nor `onSeeMore` claim the right slot.
     */
    labelEnd?: ReactNode
    /**
     * When provided, renders a "see more" link on the right of the label
     * (label text + a caret that slides right on hover).
     */
    onSeeMore?: () => void
    /** Text for the see-more link. Defaults to "Xem thêm" — pass `t(...)` to localise. */
    seeMoreLabel?: ReactNode
    /**
     * Arbitrary right-aligned slot in the label row (e.g. an owner "Add / manage"
     * button). Takes precedence over `onSeeMore` when both are passed.
     */
    action?: ReactNode
    /** Card body content. */
    children: ReactNode
    /** Extra classes merged onto the card content wrapper. */
    contentClassName?: string
    /**
     * When true, drop the inner `<Card>` frame and render children directly under
     * the label — for sections whose content is ITSELF card(s) (e.g. a grid of
     * resume / course cards), so they never nest card-in-card.
     */
    frameless?: boolean
    /**
     * When true, the framed card drops its content padding so an EDGE-OWNING child
     * (Accordion / Table / full-width-divider list) sits flush to the card edges —
     * avoids the double-padding / misaligned look. Ignored when `frameless`.
     */
    flushContent?: boolean
    /**
     * When true, the section + framed card stretch to fill their container's height
     * (`h-full` + the card grows via `flex-1`). Use for side-by-side cards in a grid
     * row so uneven content (e.g. a 1-line vs 2-line empty state) still renders at
     * equal height. Ignored when `frameless`.
     */
    fillHeight?: boolean
}

/**
 * The StarCi section card (UI 2.0): the title is a `Label` that sits OUTSIDE,
 * above the card, while the `Card` holds only content — `<Label/>` then
 * `<Card>…</Card>`. Optionally shows a right-aligned "see more →" link (the caret
 * slides right on hover). Replaces the legacy in-card header (SectionCard); owns
 * the whole look so features just pass label / icon / see-more / children.
 *
 * @param props - {@link LabeledCardProps}
 */
export const LabeledCard = ({
    label,
    icon,
    labelEnd,
    onSeeMore,
    seeMoreLabel = "Xem thêm",
    action,
    children,
    className,
    contentClassName,
    frameless = false,
    flushContent = false,
    fillHeight = false,
}: LabeledCardProps) => {
    return (
        <section className={cn("flex flex-col gap-3", fillHeight && "h-full", className)}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    {icon}
                    <Label>{label}</Label>
                </div>
                {action ?? (onSeeMore ? (
                    <Link
                        onPress={onSeeMore}
                        className="group inline-flex shrink-0 cursor-pointer items-center gap-2 text-accent"
                    >
                        {seeMoreLabel}
                        <CaretRightIcon
                            aria-hidden
                            focusable="false"
                            className="size-4 transition-transform group-hover:translate-x-1"
                        />
                    </Link>
                ) : labelEnd != null ? (
                    <span className="shrink-0 text-xs text-muted">{labelEnd}</span>
                ) : null)}
            </div>
            {/* frameless = content is itself card(s) → no inner Card (avoid nesting) */}
            {frameless ? (
                <div className={cn(contentClassName)}>{children}</div>
            ) : (
                <Card className={cn(fillHeight && "flex-1")}>
                    <CardContent className={cn(flushContent && "p-0", fillHeight && "h-full", contentClassName)}>
                        {children}
                    </CardContent>
                </Card>
            )}
        </section>
    )
}
