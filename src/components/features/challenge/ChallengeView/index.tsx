"use client"

import React from "react"
import { Accordion, Button, Chip, Skeleton, Typography } from "@heroui/react"
import { ArrowLeftIcon, HammerIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
import { Link, useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"

import { useQueryChallengeSwr } from "../hooks/useQueryChallengeSwr"
import type { ChallengeDetail } from "../hooks/useQueryChallengeSwr"
import { challengeBackHref } from "./challengeBackHref"
import { ChallengePaper } from "./ChallengePaper"
import { classifyChallengePaper } from "./paperKind"
import { GradeCodePanel } from "./GradeCodePanel"
import { UiUxChallengeEditor } from "./UiUxChallengeEditor"

/** Brief accordion sections, mapped from the challenge detail. */
const BRIEF_SECTIONS = ["requirements", "steps", "hints"] as const

/** BE lifecycle statuses that have an i18n label (`challengeSystem.status.*`). */
const KNOWN_STATUSES = new Set(["PUBLISHED", "RUNNING", "CLOSED"])

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
 * The type-specific SOLVE surface of an ordinary (paper-less) challenge: the live UI/UX
 * editor when the BE exposes a starter + target asset, the AI code-grading panel for
 * coding/SQL, a coming-soon panel otherwise.
 */
const ChallengeSolveSurface = ({ challenge }: { challenge: ChallengeDetail }) => {
    const t = useTranslations("challenge")

    if (challenge.type === "uiux" && challenge.targetImageUrl) {
        return <UiUxChallengeEditor challenge={challenge} />
    }
    if (challenge.type === "coding" || challenge.type === "sql") {
        return <GradeCodePanel challenge={challenge} challengeId={challenge.challengeUuid} />
    }
    return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-separator p-6 py-16 text-center">
            <HammerIcon className="size-8 text-muted" aria-hidden focusable="false" />
            <Typography type="body-sm" weight="semibold">
                {t("uiuxEditor.comingSoon.title")}
            </Typography>
            <Typography type="body-sm" color="muted">
                {t("uiuxEditor.comingSoon.description")}
            </Typography>
        </div>
    )
}

/**
 * The challenge solve view (§10) — `/challenges/[challengeId]`. Header + brief
 * accordions, then the type-specific solve surface: `uiux` gets the live
 * HTML/CSS/JS editor; other types show a coming-soon placeholder (out of scope).
 *
 * A challenge that carries an EXAM PAPER (`paperUrl` — a Practical Exam folded into the
 * challenge bank) is a READ surface: the paper replaces the solve surface entirely, no
 * editor and no submission, because AI grading for papers is locked. An ordinary
 * challenge carries no paper, so nothing about the existing solvers changes.
 */
export const ChallengeView = () => {
    const t = useTranslations("challenge")
    const tSystem = useTranslations("challengeSystem")
    const { challengeId } = useParams<{ challengeId: string }>()
    const router = useRouter()
    // Where the reader came from — see challengeBackHref.
    const backHref = challengeBackHref(useSearchParams().get("subject"))
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
                        onPress={() => router.push(backHref)}
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
                            href={backHref}
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
                            <Chip
                                size="sm"
                                variant="soft"
                                color={challenge.status === "RUNNING" ? "success" : undefined}
                            >
                                {KNOWN_STATUSES.has(challenge.status)
                                    ? tSystem(`status.${challenge.status}`)
                                    : challenge.status}
                            </Chip>
                            {/* tags (`pe`, the subject code, …) — the same chips the list
                                filters on, so a paper's provenance is visible here too */}
                            {challenge.tags.map((tag) => (
                                <Chip key={tag.slug} size="sm" variant="tertiary">
                                    {tag.label}
                                </Chip>
                            ))}
                        </div>
                    </div>

                    {challenge.description ? (
                        <Typography
                            type="body-sm"
                            color="muted"
                            className="whitespace-pre-line"
                        >
                            {challenge.description}
                        </Typography>
                    ) : null}

                    {/* Structured brief (requirements/steps/hints) — only when the BE
                        challenge actually carries any; the public view carries none today. */}
                    {challenge.requirements.length > 0
                        || challenge.steps.length > 0
                        || challenge.hints.length > 0 ? (
                            <ChallengeBrief challenge={challenge} />
                        ) : null}

                    {/* An exam paper OWNS the surface: read it, practise, done. Handing an
                        answer in is not offered (AI grading for papers is locked), so the
                        solvers are not even reached for a paper-bearing challenge. */}
                    {classifyChallengePaper(challenge.paperUrl, challenge.paperMime)
                        !== "MISSING" ? (
                            <ChallengePaper
                                paperUrl={challenge.paperUrl}
                                paperMime={challenge.paperMime}
                                title={challenge.title}
                            />
                        ) : (
                            <ChallengeSolveSurface challenge={challenge} />
                        )}
                </div>
            ) : null}
        </AsyncContent>
    )
}
