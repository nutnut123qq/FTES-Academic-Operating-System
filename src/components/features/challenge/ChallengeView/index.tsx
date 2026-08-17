"use client"

import React from "react"
import { Accordion, Button, Chip, Skeleton, Typography, cn } from "@heroui/react"
import { ArrowLeftIcon, HammerIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
import { Link, useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { SubjectWorkspaceShell } from "@/components/features/subject/SubjectWorkspaceShell"

import { useQueryChallengeSwr } from "../hooks/useQueryChallengeSwr"
import type { ChallengeDetail } from "../hooks/useQueryChallengeSwr"
import { challengeBackHref, challengeSubjectCode } from "./challengeBackHref"
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
 * challenge bank) replaces the solve surface entirely with {@link ChallengePaper}: the
 * paper to read on the left, the hand-in block on the right — laid out but switched off
 * while AI grading for papers is unsold (`IS_PAPER_GRADING_OPEN`). None of the code
 * solvers are reached for a paper-bearing challenge. An ordinary challenge carries no
 * paper, so nothing about the existing solvers changes.
 */
export const ChallengeView = () => {
    const t = useTranslations("challenge")
    const tSystem = useTranslations("challengeSystem")
    const { challengeId } = useParams<{ challengeId: string }>()
    const router = useRouter()
    // Where the reader came from — see challengeBackHref.
    const subjectParam = useSearchParams().get("subject")
    const backHref = challengeBackHref(subjectParam)
    // …and the workspace they came from, which the page STAYS INSIDE (see below).
    const subjectCode = challengeSubjectCode(subjectParam)
    const { challenge, isLoading, error, mutate } = useQueryChallengeSwr(challengeId)

    /**
     * Does this challenge carry an exam paper? Read once: it picks the surface below AND
     * the page width — a paper is a two-pane reader (paper ⇄ discussion) that wants the
     * whole content column, the way the FE album does, while an ordinary solve surface
     * stays inside the comfortable `max-w-6xl` measure.
     */
    const hasPaper = challenge
        ? classifyChallengePaper(challenge.paperUrl, challenge.paperMime) !== "MISSING"
        : false

    const view = (
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
                <div
                    className={cn(
                        "mx-auto flex w-full flex-col gap-6 p-6",
                        // ponytail: a paper drops the measure cap instead of getting its
                        // own layout — 1152px minus the 400px discussion column left the
                        // exam pane narrower than the scan it has to show.
                        !hasPaper && "max-w-6xl",
                    )}
                >
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

                    {/* Đề bài có thể là markdown HOẶC HTML (admin soạn bằng rich-text editor) —
                        render bằng MarkdownContent kẻo thẻ `<ul><li>` lòi ra dạng text. */}
                    {challenge.description ? (
                        <MarkdownContent
                            allowHtml
                            markdown={challenge.description}
                            className="text-muted"
                        />
                    ) : null}

                    {/* Structured brief (requirements/steps/hints) — only when the BE
                        challenge actually carries any; the public view carries none today. */}
                    {challenge.requirements.length > 0
                        || challenge.steps.length > 0
                        || challenge.hints.length > 0 ? (
                            <ChallengeBrief challenge={challenge} />
                        ) : null}

                    {/* An exam paper OWNS the surface: read it on the left, hand it in on the
                        right (gated until AI grading for papers is sold), so the code solvers
                        are not even reached for a paper-bearing challenge. */}
                    {hasPaper ? (
                        <ChallengePaper
                            paperUrl={challenge.paperUrl}
                            paperMime={challenge.paperMime}
                            // The rest of the paper (pages + templates) when the BE
                            // ships the set; `null` on an older one, which keeps the
                            // surface on its single-file behaviour.
                            paperFiles={challenge.paperFiles}
                            title={challenge.title}
                            // The comment endpoints bind a UUID, and `challenge.id` is
                            // the routing SLUG — the real id is `challengeUuid`.
                            challengeId={challenge.challengeUuid}
                            author={challenge.author}
                            createdAt={challenge.createdAt}
                        />
                    ) : (
                        <ChallengeSolveSurface challenge={challenge} />
                    )}
                </div>
            ) : null}
        </AsyncContent>
    )

    /**
     * Opened FROM a subject workspace (`?subject=CSD201`) → the page stays INSIDE that
     * workspace: the same {@link SubjectWorkspaceShell} the `/subjects/<code>/…` layout
     * mounts, reused as-is rather than copied, so the rail (Tổng quan · Thảo luận ·
     * Tài nguyên · Thực hành · Thành viên · Thống kê · Nghề nghiệp) is exactly the one
     * the reader just left — a challenge is reached from the Practice tab, and dropping
     * the rail on the way in made it feel like leaving the subject.
     *
     * No subject in the query (the global catalogue, a shared link) → no workspace to
     * claim, so the page stands on its own exactly as before.
     *
     * The rail marks "Thực hành" as the open area. It cannot work that out on its own —
     * it derives active from `pathname.startsWith("/subjects/<code>/<segment>")` and this
     * route lives at `/challenges/…`, so every row came up cold — hence the explicit
     * `activeSegment`: a challenge is only ever reached from that tab.
     */
    return subjectCode ? (
        <SubjectWorkspaceShell subjectId={subjectCode} activeSegment="practice">
            {view}
        </SubjectWorkspaceShell>
    ) : (
        view
    )
}
