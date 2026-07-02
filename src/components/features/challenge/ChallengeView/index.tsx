"use client"

import React from "react"
import {
    Accordion,
    Chip,
    Skeleton,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { UiUxChallengeEditor } from "../UiUxChallengeEditor"
import { useQueryChallengeSolveSwr } from "../hooks/useQueryChallengeSolveSwr"

/** Props for {@link ChallengeView}. */
export interface ChallengeViewProps extends WithClassNames<undefined> {
    /** Route `[challengeId]` param. */
    challengeId: string
}

/** Skeleton mirroring the solve layout (header + split editor region). */
const ChallengeViewSkeleton = () => (
    <div className="flex w-full flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-2/5 rounded-large" />
            <Skeleton className="h-4 w-3/5 rounded-large" />
        </div>
        <div className="flex min-h-[70vh] flex-col gap-4 lg:flex-row">
            <Skeleton className="min-h-[60vh] flex-1 rounded-3xl" />
            <Skeleton className="min-h-[60vh] flex-1 rounded-3xl" />
        </div>
    </div>
)

/**
 * Standalone solve surface for a single challenge (`/challenges/[challengeId]`).
 * Owns the mock fetch, switches on `challenge.type`: `uiux` → the live editor;
 * other types → a "coming soon" placeholder (out of scope). Accordions on this
 * standalone solve page use `variant="surface"` per the house rule.
 *
 * @param props - {@link ChallengeViewProps}
 */
export const ChallengeView = ({
    challengeId,
    className,
}: ChallengeViewProps) => {
    const t = useTranslations("challengeSystem")
    const swr = useQueryChallengeSolveSwr(challengeId)
    const challenge = swr.data

    return (
        <div className={className}>
            <AsyncContent
                isLoading={!swr.data && !swr.error}
                skeleton={<ChallengeViewSkeleton />}
                isEmpty={!swr.isLoading && !swr.data && !swr.error}
                emptyContent={{ title: t("uiuxEditor.notFound") }}
                error={!swr.data ? swr.error : undefined}
                errorContent={{
                    title: t("uiuxEditor.loadError"),
                    onRetry: () => {
                        void swr.mutate()
                    },
                }}
            >
                {challenge ? (
                    <div className="flex w-full flex-col gap-6">
                        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
                            <div className="flex flex-col gap-1">
                                <Typography type="h4" weight="bold">
                                    {challenge.title}
                                </Typography>
                                <Typography type="body-sm" color="muted">
                                    {challenge.brief}
                                </Typography>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Chip size="sm" variant="soft" color="accent">
                                    {t(`types.${challenge.type}`)}
                                </Chip>
                                <Chip size="sm" variant="soft">
                                    {t(`difficulty.${challenge.difficulty}`)}
                                </Chip>
                            </div>

                            {/* Solve-page accordions: surface variant (standalone page). */}
                            <Accordion
                                variant="surface"
                                className="overflow-hidden border border-default"
                            >
                                <Accordion.Item id="steps">
                                    <Accordion.Heading>
                                        <Accordion.Trigger>
                                            <Typography type="body" weight="semibold">
                                                {t("uiuxEditor.stepsTitle")}
                                            </Typography>
                                            <Accordion.Indicator />
                                        </Accordion.Trigger>
                                    </Accordion.Heading>
                                    <Accordion.Panel>
                                        <Accordion.Body>
                                            <ol className="flex list-decimal flex-col gap-1 pl-4">
                                                {challenge.steps.map((step) => (
                                                    <li key={step}>
                                                        <Typography type="body-sm" color="muted">
                                                            {step}
                                                        </Typography>
                                                    </li>
                                                ))}
                                            </ol>
                                        </Accordion.Body>
                                    </Accordion.Panel>
                                </Accordion.Item>
                                {challenge.hints.length > 0 ? (
                                    <Accordion.Item id="hints">
                                        <Accordion.Heading>
                                            <Accordion.Trigger>
                                                <Typography type="body" weight="semibold">
                                                    {t("uiuxEditor.hintsTitle")}
                                                </Typography>
                                                <Accordion.Indicator />
                                            </Accordion.Trigger>
                                        </Accordion.Heading>
                                        <Accordion.Panel>
                                            <Accordion.Body>
                                                <ul className="flex list-disc flex-col gap-1 pl-4">
                                                    {challenge.hints.map((hint) => (
                                                        <li key={hint}>
                                                            <Typography type="body-sm" color="muted">
                                                                {hint}
                                                            </Typography>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </Accordion.Body>
                                        </Accordion.Panel>
                                    </Accordion.Item>
                                ) : null}
                            </Accordion>
                        </div>

                        {challenge.type === "uiux" ? (
                            <UiUxChallengeEditor challenge={challenge} />
                        ) : (
                            <div className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6">
                                <div className="rounded-3xl border border-default bg-surface p-8 text-center">
                                    <Typography type="body-sm" color="muted">
                                        {t("uiuxEditor.comingSoon")}
                                    </Typography>
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}
