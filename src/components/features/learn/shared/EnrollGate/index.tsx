"use client"

import React, { useCallback } from "react"
import { Button, Typography } from "@heroui/react"
import { ArrowRightIcon, LockKeyIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { usePaymentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { PaymentFlow } from "@/modules/types/payment"

/** Props for {@link EnrollGate}. */
export interface EnrollGateProps extends WithClassNames<undefined> {
    /** Title — e.g. "Mở khoá Dự án cá nhân" (the surface name folded in by the caller). */
    title: string
    /** One-line reason the surface needs enrollment. */
    description: string
}

/**
 * Course-surface enroll gate: shown in place of an enrollment-required learn surface
 * (personal-project, flashcards, leaderboard, foundations) when the viewer is in trial
 * mode (not enrolled), so they see a clear "unlock by enrolling" CTA instead of a broken
 * error. Mirrors {@link import("../../LessonReader/PremiumPaywall").PremiumPaywall} but at
 * the surface level. No "try content" link — the viewer is already in trial (got here via
 * "Học thử"). The single action enrolls via the shared {@link PaymentFlow.CourseEnroll} modal.
 *
 * @param props - {@link EnrollGateProps}
 */
export const EnrollGate = ({ title, description, className }: EnrollGateProps) => {
    const t = useTranslations()
    const { open } = usePaymentOverlayState()

    /** Open the shared payment modal in the course-enroll flow. */
    const onEnroll = useCallback(
        () => open({ flow: PaymentFlow.CourseEnroll }),
        [open],
    )

    return (
        <div className={className}>
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl border border-default bg-default px-6 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-warning/10">
                    <LockKeyIcon aria-hidden focusable="false" className="size-6 text-warning" />
                </div>
                <Typography type="h4" weight="semibold">{title}</Typography>
                <Typography type="body-sm" color="muted">{description}</Typography>
                <Button
                    variant="primary"
                    size="lg"
                    className="mt-2 w-full max-w-xs"
                    onPress={onEnroll}
                >
                    {t("enrollGate.cta")}
                    <ArrowRightIcon aria-hidden focusable="false" className="size-5" />
                </Button>
            </div>
        </div>
    )
}
