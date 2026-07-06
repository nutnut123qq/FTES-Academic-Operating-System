"use client"

import React from "react"
import { Button, Card, CardContent, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { ResumeCard } from "./ResumeCard"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryContinueLearningSwr } from "../../hooks/useQueryContinueLearningSwr"

/** Props for {@link ContinueLearning}. */
export type ContinueLearningProps = WithClassNames<undefined>

/**
 * "Tiếp tục học" content — the single most important next-action slot: a capped
 * set of resume cards, CONTENT-FIRST (recently-read lessons lead, mixed with at
 * most one in-progress challenge as a nudge). When there is nothing to resume it
 * shows an onboarding CTA instead of an empty void. Content only (the parent
 * `LabeledCard` frames it, `frameless` for the self-framed resume cards).
 * Self-fetches its own mock leaf query.
 * @param props - optional root class name (placement only)
 */
export const ContinueLearning = ({ className }: ContinueLearningProps) => {
    const t = useTranslations("analytics")
    const router = useRouter()
    const { resumeItems, hasCourses, isLoading, error, mutate } = useQueryContinueLearningSwr()

    return (
        <AsyncContent
            isLoading={isLoading}
            error={error}
            errorContent={{
                title: t("overview.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("overview.retry"),
            }}
            skeleton={(
                <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-large" />
                    ))}
                </div>
            )}
        >
            <div className={cn("flex flex-col gap-3", className)}>
                {/* resume cards, or an onboarding CTA when there is nothing to resume */}
                {resumeItems.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {resumeItems.map((item) => (
                            <ResumeCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    // empty / onboarding: a real Card so it matches the framed siblings
                    <Card>
                        <CardContent className="flex flex-col items-start gap-3">
                            <Typography type="body-sm" color="muted">
                                {hasCourses
                                    ? t("overview.continue.resumeEmpty")
                                    : t("overview.continue.empty")}
                            </Typography>
                            <Button variant="primary" onPress={() => router.push("/courses")}>
                                {t("overview.continue.browse")}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AsyncContent>
    )
}
