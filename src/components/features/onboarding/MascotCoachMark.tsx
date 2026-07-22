"use client"

import React from "react"
import { Button } from "@heroui/react"
import { useTranslations } from "next-intl"
import { MascotBubble } from "@/components/reuseable/FtesMascot"
import { INTENT_POSE, type TourStep } from "./types"

/** Props for {@link MascotCoachMark}. */
export interface MascotCoachMarkProps {
    /** The step being shown. */
    step: TourStep
    /** Zero-based index of this step. */
    index: number
    /** Total number of steps (for the "n / N" progress). */
    total: number
    /** Go to the previous step (hidden on the first step). */
    onPrev: () => void
    /** Advance / finish the tour. */
    onNext: () => void
    /** Request to skip — opens the confirm prompt (hidden on the last step). */
    onSkip: () => void
    /** Whether the skip-confirm prompt is currently shown in place of the nav. */
    confirmingSkip: boolean
    /** Confirm the skip → end the whole tour. */
    onConfirmSkip: () => void
    /** Dismiss the confirm prompt and stay on the current step. */
    onCancelSkip: () => void
    /** Whether idle animation should run (off under reduced motion). */
    animated: boolean
}

/**
 * The tour speech card: the {@link MascotBubble} (mascot pose chosen from the
 * step intent) carrying the step's title + body, a "n / N" progress readout, and
 * the Back / Skip / Next(Done) controls. Copy comes from i18n keys only and the
 * body sits in the bubble's `aria-live` region so each step is announced.
 *
 * Purely presentational — positioning + the focus trap live in
 * {@link import("./SpotlightOverlay").SpotlightOverlay}.
 */
export const MascotCoachMark = ({
    step,
    index,
    total,
    onPrev,
    onNext,
    onSkip,
    confirmingSkip,
    onConfirmSkip,
    onCancelSkip,
    animated,
}: MascotCoachMarkProps) => {
    const t = useTranslations()
    const isFirst = index === 0
    const isLast = index === total - 1
    // Pass the mascot name to every copy string so marketing can swap it via the
    // `mascot.name` i18n key; steps that don't use `{name}` simply ignore it.
    const name = t("mascot.name")

    // Skip is a light two-step confirm (spec/design 4): the first "Bỏ qua" swaps the
    // step nav for a "Bỏ qua hướng dẫn?" prompt; only "Bỏ qua" there ends the tour.
    if (confirmingSkip) {
        return (
            <MascotBubble
                pose={INTENT_POSE[step.intent]}
                title={t("onboarding.skipConfirm.title")}
                animated={animated}
                actions={
                    <div className="flex w-full items-center justify-end gap-2">
                        <Button variant="tertiary" size="sm" onPress={onConfirmSkip}>
                            {t("onboarding.skipConfirm.confirm")}
                        </Button>
                        <Button variant="primary" size="sm" onPress={onCancelSkip}>
                            {t("onboarding.skipConfirm.cancel")}
                        </Button>
                    </div>
                }
            >
                {t("onboarding.skipConfirm.body")}
            </MascotBubble>
        )
    }

    return (
        <MascotBubble
            pose={INTENT_POSE[step.intent]}
            title={t(step.titleKey, { name })}
            animated={animated}
            actions={
                <div className="flex w-full items-center justify-between gap-3">
                    <span className="text-xs font-medium tabular-nums text-muted">
                        {t("onboarding.progress", { current: index + 1, total })}
                    </span>
                    <div className="flex items-center gap-2">
                        {!isLast ? (
                            <Button variant="tertiary" size="sm" onPress={onSkip}>
                                {t("onboarding.skip")}
                            </Button>
                        ) : null}
                        {!isFirst ? (
                            <Button variant="ghost" size="sm" onPress={onPrev}>
                                {t("common.back")}
                            </Button>
                        ) : null}
                        <Button variant="primary" size="sm" onPress={onNext}>
                            {isLast ? t("onboarding.finish") : t("onboarding.next")}
                        </Button>
                    </div>
                </div>
            }
        >
            {t(step.bodyKey, { name })}
        </MascotBubble>
    )
}
