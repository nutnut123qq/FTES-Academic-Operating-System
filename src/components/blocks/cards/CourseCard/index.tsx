"use client"

import React, {
    useCallback,
    useMemo,
    useState,
} from "react"
import {
    BookOpenIcon,
    CaretRightIcon,
    CheckCircleIcon,
    UsersIcon,
} from "@phosphor-icons/react"
import {
    Card,
    Chip,
    Link,
    Typography,
    cn,
} from "@heroui/react"
import {
    PriceTag,
} from "@/components/blocks/commerce/PriceTag"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    pathConfig,
} from "@/resources/path"
import type { CourseEntity } from "@/modules/types/entities/course"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { publicEnv } from "@/resources/env/public"

/** Props for {@link CourseCard}. */
export interface CourseCardProps extends WithClassNames<undefined> {
    /** The course summarised by this card (list-item data). */
    course: CourseEntity
    /**
     * Loyalty-discounted VND price (what THIS viewer is actually charged, from
     * `coursePricePreview`). When set it takes over the price block so the catalog
     * shows the same personalised price as the rest of the app; omit for the phase
     * price (guests / not-yet-loaded).
     */
    loyaltyPriceVnd?: number | null
    /** List/original VND price struck through under the loyalty price. */
    loyaltyOriginalVnd?: number | null
}

/**
 * Featured course card (catalog block): cover (with branded fallback), title,
 * outcome, social proof + top value propositions, and a price block (active-phase
 * price, original strikethrough + % off when discounted, optional USD hint) with a
 * view CTA. Owns its whole look so features just feed the `course`.
 *
 * @param props - {@link CourseCardProps}
 */
export const CourseCard = ({
    course,
    loyaltyPriceVnd,
    loyaltyOriginalVnd,
    className,
}: CourseCardProps) => {
    const locale = useLocale()
    const router = useRouter()
    const t = useTranslations()
    const [coverFailed, setCoverFailed] = useState(false)

    // display transform for ENTITY-derived (fallback) VND prices so the catalog matches
    // the rest of the app: ÷ testDivisor in non-prod (USD charm is inlined below). The
    // loyalty price (from `coursePricePreview`) is ALREADY transformed → not re-applied.
    const divisor = publicEnv().pricing.testDivisor
    const toVnd = (amount: number): number =>
        divisor === 1 ? amount : Math.max(1, Math.round(amount / divisor))

    /** Active-phase price (falls back to the list/regular price when no phase row). */
    const currentPrice = useMemo(
        () => course.pricingPhases?.find(
            (pricingPhase) => pricingPhase.phase === course.currentPhase,
        )?.price ?? course.originalPrice ?? null,
        [course.pricingPhases, course.currentPhase, course.originalPrice],
    )

    /** USD price of the active phase, falling back to the list USD price. */
    const actualPriceUsd = useMemo(
        () => course.pricingPhases?.find(
            (pricingPhase) => pricingPhase.phase === course.currentPhase,
        )?.priceUsd ?? course.originalPriceUsd ?? null,
        [course.pricingPhases, course.currentPhase, course.originalPriceUsd],
    )

    /** Formatted USD price for display, or `null` to hide the USD line. */
    const formattedPriceUsd = useMemo(
        () => actualPriceUsd != null
            // charm-round to x.99 (mirror the backend USD price)
            ? (Math.max(1, Math.ceil(actualPriceUsd)) - 0.01).toLocaleString("en-US", { style: "currency", currency: "USD" })
            : null,
        [actualPriceUsd],
    )

    /** Top three value propositions shown as a quick "what you'll learn" list. */
    const topValueProps = useMemo(
        () => (course.valuePropositions ?? []).slice(0, 3),
        [course.valuePropositions],
    )

    const onView = useCallback(
        () => router.push(
            pathConfig().locale(locale).course(course.displayId).build(),
        ),
        [router, locale, course.displayId],
    )

    const showCover = Boolean(course.coverImageUrl) && !coverFailed

    // price block: prefer the viewer's loyalty price (uniform with the rest of the app)
    // when supplied, else fall back to the active-phase price.
    const useLoyalty = loyaltyPriceVnd != null
    const displayPrice = useLoyalty
        ? loyaltyPriceVnd
        : (currentPrice != null ? toVnd(currentPrice) : null)
    const displayOriginal = useLoyalty
        ? loyaltyOriginalVnd ?? null
        : (course.originalPrice != null ? toVnd(course.originalPrice) : null)

    return (
        <Card className={cn("group flex flex-col overflow-hidden", className)}>
            <Card.Content className="flex flex-col gap-3 p-0">
                {/* cover 16:9 — full-bleed (card rounds the top); branded gradient fallback when missing/broken */}
                <div className="relative aspect-video w-full overflow-hidden bg-surface">
                    {showCover ? (
                        <img
                            src={course.coverImageUrl ?? undefined}
                            alt={course.title}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={() => setCoverFailed(true)}
                        />
                    ) : (
                        <div className="flex size-full items-center justify-center bg-gradient-to-br from-accent/25 to-accent/5 p-4">
                            <BookOpenIcon aria-hidden className="size-10 text-accent" />
                            <Typography type="body-sm" weight="semibold" align="center" className="ml-2">
                                {course.title}
                            </Typography>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 px-3">
                    <div className="flex items-center justify-between gap-2">
                        <Typography type="h6" weight="bold" truncate>
                            {course.title}
                        </Typography>
                        {course.enrollmentCount > 0 ? (
                            <Chip variant="secondary" color="accent" size="sm" className="shrink-0">
                                <UsersIcon aria-hidden className="size-4" />
                                <Chip.Label>
                                    {t("courses.learners", { count: course.enrollmentCount })}
                                </Chip.Label>
                            </Chip>
                        ) : null}
                    </div>
                    <Typography type="body-sm" color="muted" className="line-clamp-2">
                        {course.description}
                    </Typography>
                    {topValueProps.length > 0 ? (
                        <ul className="mt-1 flex flex-col gap-2">
                            {topValueProps.map((valueProp, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <CheckCircleIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                                    <Typography type="body-xs" color="muted">
                                        {valueProp.text}
                                    </Typography>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            </Card.Content>
            <Card.Footer className="mt-auto flex flex-col gap-2">
                {/* price block: single-source PriceTag — discounted (bold) + struck list +
                    real list→charge −% chip (computed by the block, never a loyalty flag) */}
                {displayPrice != null ? (
                    <PriceTag
                        discounted={displayPrice}
                        original={displayOriginal}
                        size="sm"
                    />
                ) : null}
                {formattedPriceUsd != null ? (
                    <Typography type="body-xs" color="muted">
                        {t("course.priceUsdHint", { amount: formattedPriceUsd })}
                    </Typography>
                ) : null}
                {/* see-more style CTA: accent Link with a caret that slides right on
                    hover (per starci-card.md) — the card itself is not pressable */}
                <Link
                    onPress={onView}
                    className="group inline-flex w-fit items-center gap-1 text-accent"
                >
                    {t("courses.viewCourse")}
                    <CaretRightIcon
                        aria-hidden
                        focusable="false"
                        className="size-4 transition-transform group-hover:translate-x-1"
                    />
                </Link>
            </Card.Footer>
        </Card>
    )
}
