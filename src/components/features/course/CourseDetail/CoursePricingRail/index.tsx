"use client"

import React from "react"
import {
    Card,
    CardContent,
    Separator,
    Typography,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    CourseCtaButtons,
} from "../CourseCtaButtons"
import {
    usePricingRows,
} from "../hooks/usePricingRows"
import {
    PHASE_LABEL_KEY,
} from "../constants"
import {
    PhaseRow,
} from "./PhaseRow"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { CoverImage } from "@/components/blocks/media/CoverImage"
import { PriceTag } from "@/components/blocks/commerce/PriceTag"
import { useAppSelector } from "@/redux/hooks"
import { useQueryCoursePricePreviewSwr } from "@/hooks/swr/api/graphql/queries/useQueryCoursePricePreviewSwr"

/** Props for {@link CoursePricingRail}. */
export type CoursePricingRailProps = WithClassNames<undefined>

/**
 * The single sticky purchase card (right column): cover thumbnail → headline price
 * + one discount + one scarcity line → a compact phase ladder (state per row, no
 * chip soup) → the CTA cluster → enrolled-count social proof. This is the ONLY buy
 * box on the page (the hero carries no price/CTA). Self-contained (pricing hook +
 * redux).
 *
 * @param props - optional className (placement only).
 */

export const CoursePricingRail = ({ className }: CoursePricingRailProps) => {
    const t = useTranslations()
    const { rows, active } = usePricingRows()
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const title = useAppSelector((state) => state.course.entity?.title)
    const coverImageUrl = useAppSelector((state) => state.course.entity?.coverImageUrl)
    const enrollmentCount = useAppSelector((state) => state.course.entity?.enrollmentCount) ?? 0

    // viewer's loyalty price (same source as the catalog / payment) — overrides the
    // phase headline so the price stays identical everywhere. Guests → no preview → phase.
    const { data: preview } = useQueryCoursePricePreviewSwr(courseId ?? null)
    const hasLoyalty = preview != null && preview.discountPercent > 0

    return (
        <div className={cn("md:sticky md:top-[88px] md:self-start", className)}>
            <Card>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <CoverImage src={coverImageUrl} alt={title ?? ""} />

                        {/* headline: price + ONE discount + ONE scarcity line.
                            When the viewer has a loyalty discount, the headline is THEIR price
                            (struck phase price + loyalty chip); otherwise the active phase price. */}
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                                {/* single-source PriceTag — loyalty price when the viewer has one,
                                    else the active phase price (struck vs list). USD line stays beside it. */}
                                {hasLoyalty && preview ? (
                                    <PriceTag
                                        discounted={preview.discountedPriceVnd}
                                        original={preview.originalPriceVnd}
                                        size="lg"
                                        breakdown={{
                                            phase: preview.phasePriceVnd,
                                            loyaltyPercent: preview.discountPercent,
                                        }}
                                    />
                                ) : active ? (
                                    <PriceTag
                                        discounted={active.priceVnd}
                                        original={active.listPriceVnd}
                                        size="lg"
                                        breakdown={{
                                            phase: active.priceVnd,
                                            loyaltyPercent: 0,
                                        }}
                                    />
                                ) : null}
                                {active?.formattedPriceUsd ? (
                                    <Typography type="body-sm" color="muted">
                                        {active.formattedPriceUsd}
                                    </Typography>
                                ) : null}
                            </div>
                            {active?.slotAvailable != null ? (
                                <Typography type="body-sm" className="text-warning">
                                    {t("courseLanding.slotsLeftPhase", {
                                        count: active.slotAvailable,
                                        phase: t(PHASE_LABEL_KEY[active.phase]),
                                    })}
                                </Typography>
                            ) : null}
                        </div>

                        {/* price ladder — minimal, current highlighted, future prices = urgency */}
                        {rows.length > 0 ? (
                            <>
                                <Separator />
                                <div className="flex flex-col gap-3">
                                    {rows.map((row) => (
                                        <PhaseRow key={row.id} row={row} />
                                    ))}
                                </div>
                                <Separator />
                            </>
                        ) : null}

                        <CourseCtaButtons />
                        <Typography type="body-xs" color="muted" align="center">
                            {t("course.usersEnrolled", { count: enrollmentCount })}
                        </Typography>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
