"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { Button, Card, CardContent, Chip, Label, Spinner, Typography, cn } from "@heroui/react"
import { LightningIcon, ListNumbersIcon, MicrophoneIcon, RobotIcon, StackIcon, StairsIcon, TargetIcon } from "@phosphor-icons/react"
import { useTranslations, useLocale } from "next-intl"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { SegmentedControl } from "@/components/blocks/navigation/SegmentedControl"
import { SelectableCardGroup } from "@/components/blocks/navigation/SelectableCardGroup"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { InterviewSessionSkeleton } from "./InterviewSessionSkeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { queryDrawInterviewCard } from "@/modules/api/graphql/queries/query-draw-interview-card"
import { queryMyInterviewHistory } from "@/modules/api/graphql/queries/query-my-interview-history"
import type { InterviewCardData } from "@/modules/api/graphql/queries/types/draw-interview-card"
import type { InterviewGradeResultData } from "@/modules/api/graphql/mutations/types/grade-interview-answer"
import type { GraphQLHeaders } from "@/modules/api/graphql/types"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { InterviewVerdict } from "@/modules/api/graphql/mutations/types/grade-interview-answer"
import { useMutateGradeInterviewAnswerSwr } from "@/hooks/swr/api/graphql/mutations/useMutateGradeInterviewAnswerSwr"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { useGraphQLWithToast } from "@/modules/toast/hooks"

/** Props for {@link InterviewSession}. */
export interface InterviewSessionProps extends WithClassNames<undefined> {
    /** Course to draw random interview questions across (random mode, no topic pick). */
    courseId: string
}

/** The phases of one mock-interview session. */
type InterviewPhase = "setup" | "active" | "summary"

/** A graded answer, slimmed to what the session summary aggregates. */
interface InterviewTurn {
    /** Numeric score 0–10 the backend assigned. */
    score: number
    /** Pass / borderline / fail verdict. */
    verdict: InterviewVerdict
    /** Technology tags of the question (for weak-topic aggregation). */
    tags: Array<string>
}

/** Practice modes that change how a session runs. `quick`/`deep` only differ in
 * length and ship now; `weak` (drill weak tags) + `ladder` (level progression)
 * need backend support (tag-filtered draw / per-level history) → shown coming-soon. */
type InterviewMode = "quick" | "deep"

/** Question count per practice mode. */
const MODE_LENGTH: Record<InterviewMode, number> = { quick: 5, deep: 10 }

/** Seniority levels offered at setup (mirrors the backend `FlashcardLevel` enum). */
const LEVELS = ["junior", "middle", "senior", "staff"] as const

/** HeroUI Chip color per interview seniority level (mirrors the reviewer). */
const LEVEL_COLOR: Record<string, "success" | "warning" | "danger" | "accent"> = {
    junior: "success",
    middle: "warning",
    senior: "danger",
    staff: "accent",
}

/** Soft, borderless surface shared by the question + transcript panels. */
const PANEL_CLASS = "flex flex-col gap-3 rounded-xl bg-default/40 p-8"

/**
 * Voice mock-interview over a deck, run as a fixed-length session: the learner
 * optionally picks a practice mode + seniority level, then answers a fixed
 * number of questions aloud (model answer withheld server-side). Each answer is transcribed
 * client-side and graded into a pass/borderline/fail verdict with concrete
 * feedback; at the end a summary aggregates the average score, the verdict
 * breakdown, and the weakest topics (tags of the questions not passed) so the
 * learner knows what to revisit. Draw is an imperative one-shot query (random
 * pick per question, de-duplicated within the session).
 * @param props - {@link InterviewSessionProps}
 */
export const InterviewSession = ({ courseId, className }: InterviewSessionProps) => {
    const t = useTranslations()
    const locale = useLocale()
    // recognize speech in the active UI locale (Web Speech wants a BCP-47 tag)
    const recognitionLang = locale === "vi" ? "vi-VN" : "en-US"
    // mock interview is enrolled-only → send the course header for the backend guard
    const courseHeaders = useMemo<GraphQLHeaders>(
        () => ({ [GraphQLHeadersKey.XCourseId]: courseId }),
        [courseId],
    )

    const {
        supported,
        listening,
        transcript,
        interimTranscript,
        error: speechError,
        start,
        stop,
        reset,
    } = useSpeechRecognition({ lang: recognitionLang })

    const { trigger: gradeAnswer, isMutating } = useMutateGradeInterviewAnswerSwr()
    const runGraphQL = useGraphQLWithToast()

    // which phase the session is in
    const [phase, setPhase] = useState<InterviewPhase>("setup")
    // chosen seniority level (null = any level)
    const [level, setLevel] = useState<string | null>(null)
    // chosen practice mode → drives the session length
    const [mode, setMode] = useState<InterviewMode>("quick")
    // how many questions this session runs (derived from the mode)
    const sessionLength = MODE_LENGTH[mode]
    // zero-based index of the current question within the session
    const [index, setIndex] = useState(0)
    // the currently drawn question (null while drawing / on draw failure)
    const [card, setCard] = useState<InterviewCardData | null>(null)
    // true while a draw is in flight
    const [drawing, setDrawing] = useState(false)
    // typed draw failure message, or null
    const [drawError, setDrawError] = useState<string | null>(null)
    // the grade for the current question, or null before grading
    const [result, setResult] = useState<InterviewGradeResultData | null>(null)
    // grade failure message, or null
    const [gradeError, setGradeError] = useState<string | null>(null)
    // every graded turn this session (drives the summary)
    const [turns, setTurns] = useState<Array<InterviewTurn>>([])
    // card ids already drawn this session — avoids repeats across questions
    const seenIds = useRef<Set<string>>(new Set())

    // the viewer's cross-session history for this deck (persisted server-side per
    // graded answer); `mutate` refreshes it after a session adds new attempts
    const { data: history, mutate: refreshHistory } = useSWR(
        ["interview-history", courseId],
        async () => {
            const response = await queryMyInterviewHistory({
                request: { courseId },
                headers: courseHeaders,
            })
            return response.data?.myInterviewHistory.data ?? null
        },
    )

    // draw a fresh (un-seen) random question for the current slot
    const drawCurrent = useCallback(async () => {
        setDrawing(true)
        setDrawError(null)
        setResult(null)
        setGradeError(null)
        reset()
        try {
            let drawn: InterviewCardData | null = null
            // redraw a few times to dodge a repeat within the session (decks are small)
            for (let attempt = 0; attempt < 5; attempt += 1) {
                const response = await queryDrawInterviewCard({
                    request: { courseId, level },
                    headers: courseHeaders,
                })
                const payload = response.data?.drawInterviewCard
                // typed backend failure (e.g. no gradable card at this level)
                if (!payload?.success || !payload.data) {
                    setDrawError(payload?.message ?? t("flashcard.interview.drawError"))
                    setCard(null)
                    return
                }
                drawn = payload.data
                if (!seenIds.current.has(drawn.id)) {
                    break
                }
            }
            if (drawn) {
                seenIds.current.add(drawn.id)
                setCard(drawn)
            }
        } catch {
            setDrawError(t("flashcard.interview.drawError"))
            setCard(null)
        } finally {
            setDrawing(false)
        }
    }, [courseId, level, reset, t, courseHeaders])

    // while active, (re)draw whenever the slot index changes
    useEffect(() => {
        if (phase === "active") {
            void drawCurrent()
        }
    }, [phase, index, drawCurrent])

    // begin a session at the chosen level: reset all per-session state
    const startSession = useCallback(() => {
        seenIds.current.clear()
        setTurns([])
        setIndex(0)
        setPhase("active")
    }, [])

    // grade the spoken answer; stop the mic first so the last phrase is finalized
    const submit = useCallback(async () => {
        if (!card || transcript.trim().length === 0) {
            return
        }
        if (listening) {
            stop()
        }
        setGradeError(null)
        let gradeResult: InterviewGradeResultData | null = null
        const ok = await runGraphQL(async () => {
            const response = await gradeAnswer({
                flashcardDeckId: card.deckId,
                flashcardCardId: card.id,
                transcript: transcript.trim(),
            })
            const payload = response.data?.gradeInterviewAnswer
            gradeResult = payload?.data ?? null
            return (
                payload ?? {
                    success: false,
                    message: t("flashcard.interview.gradeError"),
                }
            )
        })
        if (ok && gradeResult) {
            const graded = gradeResult as InterviewGradeResultData
            setResult(graded)
            // record this turn for the end-of-session summary
            setTurns((previous) => [
                ...previous,
                {
                    score: graded.score,
                    verdict: graded.verdict,
                    tags: card.tags ?? [],
                },
            ])
        } else {
            setGradeError(t("flashcard.interview.gradeError"))
        }
    }, [card, transcript, listening, stop, gradeAnswer, runGraphQL, t])

    // advance to the next question, or end the session after the last one
    const advance = useCallback(() => {
        if (index < sessionLength - 1) {
            setIndex((previous) => previous + 1)
        } else {
            // session done — the attempts are now persisted, so refresh history
            void refreshHistory()
            setPhase("summary")
        }
    }, [index, sessionLength, refreshHistory])

    // ── SETUP — readiness hub (single column, no bento split) ────────────
    if (phase === "setup") {
        // weak/ladder need backend (tag-filtered draw / per-level history) → coming-soon
        const comingSoonBadge = (
            <span className="text-xs text-muted">{t("flashcard.interview.comingSoon")}</span>
        )
        return (
            <div className={cn("flex flex-col gap-6", className)}>
                <Card>
                    <CardContent className="flex flex-col gap-6">
                        {/* hero: mic + headline */}
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                                <MicrophoneIcon className="size-6" aria-hidden focusable="false" />
                            </div>
                            <div className="flex flex-col">
                                <Typography type="h4" weight="semibold">
                                    {t("flashcard.interview.setupTitle")}
                                </Typography>
                                <Typography type="body-sm" color="muted">
                                    {t("flashcard.interview.setupSubtitle")}
                                </Typography>
                            </div>
                        </div>

                        {/* what to expect — quick chips */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Chip size="sm" variant="soft" color="default">
                                <ListNumbersIcon className="size-4" aria-hidden focusable="false" />
                                {t("flashcard.interview.expectCount", { total: sessionLength })}
                            </Chip>
                            <Chip size="sm" variant="soft" color="default">
                                <MicrophoneIcon className="size-4" aria-hidden focusable="false" />
                                {t("flashcard.interview.expectVoice")}
                            </Chip>
                            <Chip size="sm" variant="soft" color="default">
                                <RobotIcon className="size-4" aria-hidden focusable="false" />
                                {t("flashcard.interview.expectAiGrade")}
                            </Chip>
                        </div>

                        {/* readiness — compact full-width strip (not a side column) */}
                        <div className="flex flex-col gap-2">
                            <Label>{t("flashcard.interview.readinessTitle")}</Label>
                            {history === undefined ? (
                                <div className="flex items-center gap-3">
                                    <Skeleton.Typography type="h4" width="1/4" />
                                    <Skeleton.Meter className="flex-1" />
                                </div>
                            ) : history && history.totalAnswered > 0 ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                                        <div className="flex items-baseline gap-2">
                                            <Typography className="text-2xl font-medium text-foreground">
                                                {history.averageScore}
                                            </Typography>
                                            <Typography type="body-xs" color="muted">
                                                {`/100 · ${t("flashcard.interview.bestScore").toLowerCase()} ${history.bestScore}`}
                                            </Typography>
                                        </div>
                                        <ProgressMeter value={history.averageScore} max={100} className="min-w-40 flex-1" />
                                    </div>
                                    {/* verdict breakdown — pass / borderline / fail counts */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Chip size="sm" variant="soft" color="success">
                                            {`${t("flashcard.interview.pass")} · ${history.passCount}`}
                                        </Chip>
                                        <Chip size="sm" variant="soft" color="warning">
                                            {`${t("flashcard.interview.borderline")} · ${history.borderlineCount}`}
                                        </Chip>
                                        <Chip size="sm" variant="soft" color="danger">
                                            {`${t("flashcard.interview.fail")} · ${history.failCount}`}
                                        </Chip>
                                    </div>
                                    {/* weak topics to revisit (tag-filtered drill ships next round) */}
                                    {history.weakTags.length > 0 ? (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {history.weakTags.map((tag) => (
                                                <Chip key={tag} size="sm" variant="soft" color="default">
                                                    {tag}
                                                </Chip>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                // never interviewed yet → meter at 0 + nudge (don't self-hide)
                                <div className="flex flex-wrap items-center gap-3">
                                    <ProgressMeter value={0} max={100} className="min-w-40 flex-1" />
                                    <Typography type="body-sm" color="muted">
                                        {t("flashcard.interview.readinessEmpty")}
                                    </Typography>
                                </div>
                            )}
                        </div>

                        {/* practice mode — selectable surface cards (one lights up) */}
                        <div className="flex flex-col gap-2">
                            <Label>{t("flashcard.interview.modeLabel")}</Label>
                            <SelectableCardGroup
                                ariaLabel={t("flashcard.interview.modeLabel")}
                                value={mode}
                                onChange={(next) => {
                                    // only quick/deep are selectable (weak/ladder disabled)
                                    if (next === "quick" || next === "deep") {
                                        setMode(next)
                                    }
                                }}
                                columns={2}
                                items={[
                                    {
                                        value: "quick",
                                        label: t("flashcard.interview.modeQuick"),
                                        icon: <LightningIcon className="size-4" />,
                                    },
                                    {
                                        value: "deep",
                                        label: t("flashcard.interview.modeDeep"),
                                        icon: <StackIcon className="size-4" />,
                                    },
                                    {
                                        value: "weak",
                                        label: t("flashcard.interview.modeWeak"),
                                        icon: <TargetIcon className="size-4" />,
                                        isDisabled: true,
                                        badge: comingSoonBadge,
                                    },
                                    {
                                        value: "ladder",
                                        label: t("flashcard.interview.modeLadder"),
                                        icon: <StairsIcon className="size-4" />,
                                        isDisabled: true,
                                        badge: comingSoonBadge,
                                    },
                                ]}
                            />
                        </div>

                        {/* seniority level — group label uses <Label> + block segmented */}
                        <div className="flex flex-col gap-2">
                            <Label>{t("flashcard.interview.levelLabel")}</Label>
                            <SegmentedControl
                                ariaLabel={t("flashcard.interview.levelLabel")}
                                value={level ?? "all"}
                                onChange={(value) => setLevel(value === "all" ? null : value)}
                                items={[
                                    { value: "all", label: t("flashcard.interview.levelAll") },
                                    ...LEVELS.map((value) => ({
                                        value,
                                        label: t(`flashcard.level.${value}`),
                                    })),
                                ]}
                            />
                        </div>

                        {/* primary CTA — loud, mic-led (one primary action) */}
                        <Button variant="primary" size="lg" className="self-start" onPress={startSession}>
                            <MicrophoneIcon className="size-5" aria-hidden focusable="false" />
                            {t("flashcard.interview.begin")}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // ── SUMMARY ──────────────────────────────────────────────────────────
    if (phase === "summary") {
        const answered = turns.length
        const averageScore =
            answered > 0
                ? Math.round(
                    (turns.reduce((sum, turn) => sum + turn.score, 0) / answered) * 10,
                ) / 10
                : 0
        const passCount = turns.filter((turn) => turn.verdict === InterviewVerdict.Pass).length
        const borderlineCount = turns.filter(
            (turn) => turn.verdict === InterviewVerdict.Borderline,
        ).length
        const failCount = turns.filter((turn) => turn.verdict === InterviewVerdict.Fail).length
        // weakest topics: tag frequency across the questions not passed
        const weakTagCounts = new Map<string, number>()
        for (const turn of turns) {
            if (turn.verdict !== InterviewVerdict.Pass) {
                for (const tag of turn.tags) {
                    weakTagCounts.set(tag, (weakTagCounts.get(tag) ?? 0) + 1)
                }
            }
        }
        const weakTags = [...weakTagCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([tag]) => tag)

        return (
            <div className={cn("flex flex-col gap-6", className)}>
                <div className="flex flex-col gap-6 rounded-xl bg-default/40 p-8">
                    <div className="flex items-center justify-between gap-3">
                        <Typography type="body" weight="medium">
                            {t("flashcard.interview.summaryTitle")}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {t("flashcard.interview.progress", {
                                current: answered,
                                total: sessionLength,
                            })}
                        </Typography>
                    </div>

                    {/* average score + verdict breakdown */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-col">
                            <Typography type="body-xs" color="muted">
                                {t("flashcard.interview.avgScore")}
                            </Typography>
                            <Typography className="text-2xl font-medium text-foreground">
                                {averageScore}
                            </Typography>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Chip size="sm" variant="soft" color="success">
                                {t("flashcard.interview.pass")} · {passCount}
                            </Chip>
                            <Chip size="sm" variant="soft" color="warning">
                                {t("flashcard.interview.borderline")} · {borderlineCount}
                            </Chip>
                            <Chip size="sm" variant="soft" color="danger">
                                {t("flashcard.interview.fail")} · {failCount}
                            </Chip>
                        </div>
                    </div>

                    {/* weak topics to revisit (from questions not passed) */}
                    {weakTags.length > 0 ? (
                        <div className="flex flex-col gap-2 border-t border-divider pt-6">
                            <Typography type="body-xs" weight="medium" color="muted">
                                {t("flashcard.interview.weakTags")}
                            </Typography>
                            <div className="flex flex-wrap items-center gap-2">
                                {weakTags.map((tag) => (
                                    <Chip key={tag} size="sm" variant="soft" color="default">
                                        {tag}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <Button
                        variant="primary"
                        className="self-start"
                        onPress={() => setPhase("setup")}
                    >
                        {t("flashcard.interview.replay")}
                    </Button>
                </div>
            </div>
        )
    }

    // ── ACTIVE ───────────────────────────────────────────────────────────
    // initial load / redraw: mirror with a content-shaped skeleton
    if (drawing) {
        return <InterviewSessionSkeleton />
    }

    // draw failed (e.g. no gradable card at this level) — offer a retry
    if (drawError || !card) {
        return (
            <div className="flex flex-col items-center gap-3 py-10">
                <Typography type="body-sm" color="muted" align="center">
                    {drawError}
                </Typography>
                <Button size="sm" variant="secondary" onPress={() => void drawCurrent()}>
                    {t("flashcard.interview.retry")}
                </Button>
            </div>
        )
    }

    // three distinct verdicts: pass (đạt) / borderline (cận) / fail (chưa đạt)
    const verdict = result?.verdict
    const verdictColor: "success" | "warning" | "danger" =
        verdict === InterviewVerdict.Pass
            ? "success"
            : verdict === InterviewVerdict.Borderline
                ? "warning"
                : "danger"
    const verdictLabel =
        verdict === InterviewVerdict.Pass
            ? t("flashcard.interview.pass")
            : verdict === InterviewVerdict.Borderline
                ? t("flashcard.interview.borderline")
                : t("flashcard.interview.fail")
    // whether anything has been transcribed yet (gates the submit button)
    const hasTranscript = transcript.trim().length > 0
    // the action shown after grading: advance, or finish on the last question
    const isLastQuestion = index >= sessionLength - 1

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {/* session progress + question meta (level + tags) */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Typography type="body-sm" weight="medium" color="muted">
                    {t("flashcard.interview.progress", {
                        current: index + 1,
                        total: sessionLength,
                    })}
                </Typography>
                {(card.level || (card.tags?.length ?? 0) > 0) ? (
                    <div className="flex flex-wrap items-center gap-2">
                        {card.level ? (
                            <Chip size="sm" variant="soft" color={LEVEL_COLOR[card.level] ?? "default"}>
                                {t(`flashcard.level.${card.level}`)}
                            </Chip>
                        ) : null}
                        {card.tags?.map((tag) => (
                            <Chip key={tag} size="sm" variant="soft" color="default">
                                {tag}
                            </Chip>
                        ))}
                    </div>
                ) : null}
            </div>

            {/* the question prompt (answer is never sent to the client) */}
            <div className={PANEL_CLASS}>
                <Typography type="body-xs" weight="medium" color="muted">
                    {t("flashcard.questionLabel")}
                </Typography>
                <div className="text-lg font-medium text-foreground">
                    <MarkdownContent markdown={card.question} />
                </div>
            </div>

            {/* the recorder: unsupported notice, or mic control + live transcript */}
            {!supported ? (
                <div className="rounded-xl bg-default/40 p-4">
                    <Typography type="body-sm" color="muted" align="center">
                        {t("flashcard.interview.unsupported")}
                    </Typography>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-center">
                        <Button
                            variant={listening ? "danger" : "primary"}
                            onPress={() => (listening ? stop() : start())}
                            isDisabled={isMutating}
                        >
                            <MicrophoneIcon className="size-5" aria-hidden focusable="false" />
                            {listening
                                ? t("flashcard.interview.stop")
                                : t("flashcard.interview.record")}
                        </Button>
                    </div>

                    {/* recording pulse hint */}
                    {listening ? (
                        <div className="flex items-center justify-center gap-2">
                            <span className="size-2 animate-pulse rounded-full bg-danger" />
                            <Typography type="body-xs" className="text-danger">
                                {t("flashcard.interview.recording")}
                            </Typography>
                        </div>
                    ) : null}

                    {/* live transcript: finalized words + greyed interim tail */}
                    <div className={PANEL_CLASS}>
                        <Typography type="body-xs" weight="medium" color="muted">
                            {t("flashcard.interview.yourAnswer")}
                        </Typography>
                        {hasTranscript || interimTranscript ? (
                            <Typography className="text-foreground">
                                {transcript}{" "}
                                <span className="text-muted">{interimTranscript}</span>
                            </Typography>
                        ) : (
                            <Typography type="body-sm" color="muted">
                                {t("flashcard.interview.transcriptHint")}
                            </Typography>
                        )}
                    </div>

                    {/* microphone permission / recognition error */}
                    {speechError ? (
                        <Typography type="body-xs" align="center" className="text-danger">
                            {t("flashcard.interview.micError")}
                        </Typography>
                    ) : null}
                </div>
            )}

            {/* submit the transcript for grading (before a verdict exists) */}
            {!result ? (
                <div className="flex items-center justify-end gap-3">
                    <Button
                        size="sm"
                        variant="primary"
                        onPress={() => void submit()}
                        isPending={isMutating}
                        isDisabled={!hasTranscript || listening}
                    >
                        {t("flashcard.interview.submit")}
                    </Button>
                </div>
            ) : null}

            {/* grade error (transport / typed failure) */}
            {gradeError ? (
                <Typography type="body-sm" align="center" className="text-danger">
                    {gradeError}
                </Typography>
            ) : null}

            {/* grading spinner while the answer is in flight */}
            {isMutating ? (
                <div className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    <Typography type="body-sm" color="muted">
                        {t("flashcard.interview.grading")}
                    </Typography>
                </div>
            ) : null}

            {/* the verdict result: đạt / cận / chưa đạt + score + strengths/gaps + hints */}
            {result && !isMutating ? (
                <div className="flex flex-col gap-6 rounded-xl bg-default/40 p-8">
                    {/* headline verdict + numeric score */}
                    <div className="flex items-center justify-between gap-3">
                        <Chip size="md" variant="soft" color={verdictColor}>
                            {verdictLabel}
                        </Chip>
                        <Typography type="body-sm" weight="medium">
                            {t("flashcard.interview.score", { score: result.score })}
                        </Typography>
                    </div>

                    {/* concrete things done right */}
                    {result.strengths.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            <Typography type="body-xs" weight="medium" className="text-success">
                                {t("flashcard.interview.strengths")}
                            </Typography>
                            <ul className="flex list-disc flex-col gap-2 pl-5">
                                {result.strengths.map((strength, position) => (
                                    <li key={position}>
                                        <Typography type="body-sm">{strength}</Typography>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {/* concrete gaps to address */}
                    {result.gaps.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            <Typography type="body-xs" weight="medium" className="text-danger">
                                {t("flashcard.interview.gaps")}
                            </Typography>
                            <ul className="flex list-disc flex-col gap-2 pl-5">
                                {result.gaps.map((gap, position) => (
                                    <li key={position}>
                                        <Typography type="body-sm">{gap}</Typography>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {/* one-line nudge toward the model answer */}
                    {result.modelAnswerHint ? (
                        <div className="flex flex-col gap-2 border-t border-divider pt-6">
                            <Typography type="body-xs" weight="medium" color="muted">
                                {t("flashcard.interview.hint")}
                            </Typography>
                            <Typography type="body-sm">{result.modelAnswerHint}</Typography>
                        </div>
                    ) : null}

                    {/* a natural interviewer follow-up to think about next */}
                    {result.followUpQuestion ? (
                        <div className="flex flex-col gap-2">
                            <Typography type="body-xs" weight="medium" color="muted">
                                {t("flashcard.interview.followUp")}
                            </Typography>
                            <Typography type="body-sm">{result.followUpQuestion}</Typography>
                        </div>
                    ) : null}

                    {/* advance to the next question, or finish the session */}
                    <Button
                        variant="primary"
                        className="self-start"
                        onPress={advance}
                    >
                        {isLastQuestion
                            ? t("flashcard.interview.viewResults")
                            : t("flashcard.interview.nextQuestion")}
                    </Button>
                </div>
            ) : null}
        </div>
    )
}
