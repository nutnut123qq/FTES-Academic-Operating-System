"use client"

import React from "react"
import { Accordion, Button, Chip, Skeleton, Typography } from "@heroui/react"
import { ArrowLeftIcon, HammerIcon, MagnifyingGlassIcon, TrophyIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Link, useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"

import { useQueryChallengeSwr } from "../hooks/useQueryChallengeSwr"
import type { ChallengeDetail } from "../hooks/useQueryChallengeSwr"
import { UiUxChallengeEditor } from "./UiUxChallengeEditor"

/** Brief accordion sections, mapped from the challenge mock. */
const BRIEF_SECTIONS = ["requirements", "steps", "hints"] as const

/** Loading skeleton mirroring the solve layout: header + brief + editor split. */
const ChallengeViewSkeleton = () => (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        {/* header: back link, then a tight title↔meta cluster (mirrors the real header) */}
        <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-8 w-72 rounded-large" />
            <Skeleton className="h-6 w-48 rounded-full" />
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full rounded-3xl" />
            <Skeleton className="h-12 w-full rounded-3xl" />
            <Skeleton className="h-12 w-full rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-[480px] w-full rounded-2xl" />
            <div className="flex flex-col gap-6">
                <Skeleton className="h-[320px] w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
        </div>
    </div>
)

/** Brief accordions (Yêu cầu · Các bước · Gợi ý) — solve page = surface variant. */
const ChallengeBrief = ({ challenge }: { challenge: ChallengeDetail }) => {
    const t = useTranslations("challenge")
    return (
        <Accordion variant="surface" className="overflow-hidden border border-default">
            {BRIEF_SECTIONS.map((section) => (
                <Accordion.Item key={section} aria-label={t(`uiuxEditor.brief.${section}`)}>
                    <Accordion.Heading>
                        <Accordion.Trigger>
                            <div className="flex w-full items-center justify-between gap-3 text-start">
                                <span className="text-base font-semibold">
                                    {t(`uiuxEditor.brief.${section}`)}
                                </span>
                                <Accordion.Indicator />
                            </div>
                        </Accordion.Trigger>
                    </Accordion.Heading>
                    <Accordion.Panel>
                        <Accordion.Body>
                            <ul className="flex list-disc flex-col gap-2 ps-5">
                                {challenge[section].map((item, index) => (
                                    <li key={index} className="text-sm text-foreground">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </Accordion.Body>
                    </Accordion.Panel>
                </Accordion.Item>
            ))}
        </Accordion>
    )
}

/**
 * The challenge solve view (§10) — `/challenges/[challengeId]`. Header + brief
 * accordions, then the type-specific solve surface: `uiux` gets the live
 * HTML/CSS/JS editor; other types show a coming-soon placeholder (out of scope).
 */
export const ChallengeView = () => {
    const t = useTranslations("challenge")
    const tSystem = useTranslations("challengeSystem")
    const { challengeId } = useParams<{ challengeId: string }>()
    const router = useRouter()
    const { challenge, isLoading, error, mutate } = useQueryChallengeSwr(challengeId)

    return (
        <AsyncContent
            isLoading={isLoading}
            skeleton={<ChallengeViewSkeleton />}
            error={error}
            errorContent={{
                title: t("uiuxEditor.state.errorTitle"),
                onRetry: () => {
                    void mutate()
                },
                retryLabel: t("uiuxEditor.state.retry"),
                className: "p-6 py-16",
            }}
            isEmpty={!challenge}
            emptyContent={{
                icon: (
                    <MagnifyingGlassIcon className="size-8 text-muted" aria-hidden focusable="false" />
                ),
                title: t("uiuxEditor.state.notFound"),
                action: (
                    <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => router.push("/challenges")}
                    >
                        {t("uiuxEditor.backToCatalog")}
                    </Button>
                ),
                className: "p-6 py-16",
            }}
        >
            {challenge ? (
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
                    {/* header: back link, then a tight title↔meta cluster */}
                    <div className="flex flex-col gap-2">
                        <Link
                            href="/challenges"
                            className="flex w-fit items-center gap-2 text-sm text-muted no-underline transition-colors hover:text-foreground"
                        >
                            <ArrowLeftIcon className="size-4" aria-hidden focusable="false" />
                            {t("uiuxEditor.backToCatalog")}
                        </Link>
                        <Typography type="h4" weight="bold">
                            {challenge.title}
                        </Typography>
                        <div className="flex flex-wrap items-center gap-2">
                            <Chip size="sm" variant="soft" color="accent">
                                {tSystem(`types.${challenge.type}`)}
                            </Chip>
                            <Chip size="sm" variant="soft">
                                {tSystem(`difficulty.${challenge.difficulty}`)}
                            </Chip>
                            <span className="flex items-center gap-2 text-muted">
                                <TrophyIcon className="size-4" aria-hidden focusable="false" />
                                <Typography type="body-xs" color="muted">
                                    {tSystem("pointsCount", { count: challenge.points })}
                                </Typography>
                            </span>
                        </div>
                    </div>

                    <ChallengeBrief challenge={challenge} />

                    {challenge.type === "uiux" ? (
                        <UiUxChallengeEditor challenge={challenge} />
                    ) : (
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-separator p-6 py-16 text-center">
                            <HammerIcon
                                className="size-8 text-muted"
                                aria-hidden
                                focusable="false"
                            />
                            <Typography type="body-sm" weight="semibold">
                                {t("uiuxEditor.comingSoon.title")}
                            </Typography>
                            <Typography type="body-sm" color="muted">
                                {t("uiuxEditor.comingSoon.description")}
                            </Typography>
                        </div>
                    )}
                </div>
            ) : null}
        </AsyncContent>
    )
}
