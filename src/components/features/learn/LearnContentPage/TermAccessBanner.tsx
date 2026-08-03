"use client"

import { Button } from "@heroui/react"
import { CalendarCheckIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { useFormatter, useTranslations } from "next-intl"
import { Callout } from "@/components/blocks/feedback/Callout"
import type { CourseAccessStateView } from "@/modules/api/rest/course"

/** A term deadline within this many days flips the notice to a `warning` tone. */
const EXPIRING_SOON_DAYS = 7
const EXPIRING_SOON_MS = EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000

/** Props for {@link TermAccessBanner}. */
export interface TermAccessBannerProps {
    /** The caller's own access state on this course (`null` for a guest / not-found). */
    access: CourseAccessStateView | null
    /** Whether the viewer currently has FULL access (gates the "open until" notice). */
    hasFullAccess: boolean
    /** Re-buy / re-enrol handler — the canonical enroll flow (resolve → cart → PaymentModal). */
    onRebuy: () => void
    /** Whether {@link onRebuy} can actually check out (course on sale) — else disable the CTA. */
    canRebuy: boolean
    /** Whether the re-buy checkout is in flight (drive the CTA's pending state). */
    isRebuying: boolean
}

/**
 * Term-access banner for the learn dashboard. Renders one of two states from the
 * caller's own {@link CourseAccessStateView}, or nothing when access is permanent:
 *
 * - **Notice** — when access is time-bound to a term (`accessUntil` set) and still
 *   valid: "Quyền học của bạn mở đến {date}". Emphasised (warning tone) inside the
 *   last ~7 days.
 * - **Expired** — when the term ended and the viewer was kicked (`expired`): a paused-
 *   access note + a "mua lại / đăng ký lại" CTA that reuses the canonical enroll flow
 *   (never a "VIP" upsell, rule premium-unlock-is-enroll-not-vip).
 *
 * Style-free feature glue: it owns the copy, date formatting and i18n, and delegates
 * all visuals to the {@link Callout} block.
 */
export const TermAccessBanner = ({
    access,
    hasFullAccess,
    onRebuy,
    canRebuy,
    isRebuying,
}: TermAccessBannerProps) => {
    const t = useTranslations("learn")
    const format = useFormatter()

    if (!access) return null

    // Expired → term ended, access paused. Offer re-buy (enroll flow). Takes precedence
    // over the notice: an expired viewer has no live deadline to advertise.
    if (access.expired === true) {
        return (
            <Callout
                status="danger"
                icon={<WarningCircleIcon aria-hidden focusable="false" />}
                title={t("content.termAccess.expiredTitle")}
                description={t("content.termAccess.expiredBody")}
                action={(
                    <Button
                        variant="primary"
                        size="sm"
                        isDisabled={!canRebuy}
                        isPending={isRebuying}
                        onPress={onRebuy}
                    >
                        {t("content.termAccess.rebuy")}
                    </Button>
                )}
            />
        )
    }

    // Notice — access is time-bound but still valid AND the viewer holds full access.
    if (access.accessUntil && hasFullAccess) {
        const until = new Date(access.accessUntil)
        const soon = until.getTime() - Date.now() <= EXPIRING_SOON_MS
        return (
            <Callout
                status={soon ? "warning" : "accent"}
                icon={<CalendarCheckIcon aria-hidden focusable="false" />}
                title={t("content.termAccess.until", {
                    date: format.dateTime(until, { dateStyle: "long" }),
                })}
                description={soon ? t("content.termAccess.untilSoon") : undefined}
            />
        )
    }

    return null
}
