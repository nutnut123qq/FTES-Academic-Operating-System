"use client"

import React from "react"
import {
    Button,
    Card,
    CardContent,
    Typography,
    cn,
} from "@heroui/react"
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
import {
    ResumeCard,
} from "./ResumeCard"
import {
    ContinueLearningSkeleton,
} from "./ContinueLearningSkeleton"
import {
    useResumeItems,
} from "./useResumeItems"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"

/** Props for {@link ContinueLearning}. */
export type ContinueLearningProps = WithClassNames<undefined>

/**
 * "Tiếp tục học" content — the single most important next-action slot: a capped
 * set of resume cards, CONTENT-FIRST (recently-read lessons lead, mixed with at
 * most one in-progress challenge as a nudge). When the viewer has joined no course it shows an
 * onboarding CTA instead of an empty void. Content only (the parent
 * {@link import("@/components/blocks").LabeledCard} frames it; the greeting lives
 * in the identity column). Self-fetches its own leaf queries (no data props).
 * @param props - optional className for the root element.
 */
export const ContinueLearning = ({
    className,
}: ContinueLearningProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const {
        resumeItems,
        hasCourses,
        isLoading,
    } = useResumeItems()

    // the resume slot is loading → onboarding/cards (no generic empty: the "nothing
    // to resume" case is a designed onboarding CTA, so it lives in the content branch,
    // not AsyncContent's emptyContent). debug holds the skeleton ~3s for inspection.
    return (
        <AsyncContent
            isLoading={isLoading}
            skeleton={<ContinueLearningSkeleton className={className} />}
        >
            <div className={cn("flex flex-col gap-3", className)}>
                {/* resume cards, or an onboarding CTA when there is nothing to resume */}
                {resumeItems.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {resumeItems.map((item) => (
                            <ResumeCard
                                key={item.globalId}
                                item={item}
                            />
                        ))}
                    </div>
                ) : (
                    // empty / onboarding: a real Card so it matches the framed sibling sections
                    // (the parent LabeledCard is `frameless` for the self-framed resume cards).
                    <Card>
                        <CardContent className="flex flex-col items-start gap-3">
                            <Typography type="body-sm" color="muted">
                                {hasCourses
                                    ? t("dashboard.continueResumeEmpty")
                                    : t("dashboard.emptyCourses")}
                            </Typography>
                            <Button
                                variant="primary"
                                onPress={() => router.push(pathConfig().locale(locale).course().build())}
                            >
                                {t("dashboard.browseCourses")}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AsyncContent>
    )
}
