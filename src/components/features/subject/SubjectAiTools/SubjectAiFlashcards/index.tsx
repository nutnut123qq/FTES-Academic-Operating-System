"use client"

import React from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { CheckCircleIcon, CursorClickIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { SegmentBar } from "@/components/blocks/stats/SegmentBar"

import { useQuerySubjectAiSourcesSwr } from "../../hooks/useQuerySubjectAiSourcesSwr"
import { useMutateSubjectAiFlashcardsSwr } from "../../hooks/useMutateSubjectAiFlashcardsSwr"
import { ToolSurfaceHeader } from "../ToolSurfaceHeader"
import { SourcePicker } from "../SourcePicker"
import { SM2_GRADES, nextIntervalDays } from "./constants"

/** Props for {@link SubjectAiFlashcards}. */
export interface SubjectAiFlashcardsProps {
    subjectId: string
    subjectCode: string
    onBack: () => void
    onGoResources: () => void
}

/**
 * Flashcards tool surface — a faithful port of StarCI's `FlashcardReviewer` (STT 29D).
 * Pick a source → generate a mock deck, then run the polished "Ôn tập" reviewer:
 * one card at a time (Markdown-free mock term/definition), flip front↔back, a
 * "Thẻ i/total" progress meter, and — once revealed — an SM-2 self-rating row
 * (Quên / Khó / Được / Dễ) where each grade previews its real next interval and
 * reschedules the card client-side (no BE), advancing the run. A deck/stats strip
 * frames the session (mastered · learning · new), and a summary closes it
 * (studyAgain / regenerate). Wired into FTES's source-pick → generate flow.
 */
export const SubjectAiFlashcards = ({
    subjectId,
    subjectCode,
    onBack,
    onGoResources,
}: SubjectAiFlashcardsProps) => {
    const t = useTranslations()
    const headingRef = React.useRef<HTMLHeadingElement>(null)
    const { sources } = useQuerySubjectAiSourcesSwr(subjectId)
    const deckSwr = useMutateSubjectAiFlashcardsSwr(subjectId)

    const [selectedId, setSelectedId] = React.useState<string | null>(null)
    // index of the card currently shown + whether it's flipped to its answer
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [revealed, setRevealed] = React.useState(false)
    // how many cards were graded this run (shown in the summary), and per-card
    // recall streaks so the SM-2 interval preview grows as a card is recalled
    const [reviewedCount, setReviewedCount] = React.useState(0)
    const [streaks, setStreaks] = React.useState<Record<string, number>>({})

    React.useEffect(() => {
        headingRef.current?.focus()
    }, [])

    const selected = sources.find((s) => s.id === selectedId) ?? null
    const deck = deckSwr.data ?? null
    const cards = deck?.cards ?? []
    const card = cards[currentIndex] ?? null
    // past the last card → the run is complete (mirrors StarCI's `done`)
    const done = cards.length > 0 && currentIndex >= cards.length
    const isFirst = currentIndex === 0

    // deck maturity split for the framing strip (mirrors FlashcardStatsStrip):
    // cards already graded this run = "mastered", the current one = "learning",
    // the rest = "new". All derived — no extra state.
    const mastered = Math.min(reviewedCount, cards.length)
    const learning = done ? 0 : Math.min(1, cards.length - mastered)
    const newCount = Math.max(0, cards.length - mastered - learning)

    const generate = async () => {
        if (!selected) return
        setCurrentIndex(0)
        setRevealed(false)
        setReviewedCount(0)
        setStreaks({})
        try {
            await deckSwr.trigger({ subjectCode, sourceTitle: selected.title })
        } catch {
            // error rendered from deckSwr.error
        }
    }

    /** Step back to re-grade an earlier card (always on its question side). */
    const goPrev = () => {
        setRevealed(false)
        setCurrentIndex((index) => Math.max(index - 1, 0))
    }

    /**
     * Grade the current card (SM-2), reschedule it client-side, then advance.
     * A "Good"/"Easy" grade grows the card's recall streak (so its interval
     * preview lengthens next time); "Again" resets it — no BE persistence.
     */
    const onRate = (grade: number) => {
        if (!card) return
        setStreaks((prev) => {
            const current = prev[card.id] ?? 0
            const next = grade === 0 ? 0 : grade >= 2 ? current + 1 : current
            return { ...prev, [card.id]: next }
        })
        setReviewedCount((count) => count + 1)
        setRevealed(false)
        setCurrentIndex((index) => index + 1)
    }

    /** Restart the deck from the first card (keeps the generated deck). */
    const restart = () => {
        setCurrentIndex(0)
        setRevealed(false)
        setReviewedCount(0)
        setStreaks({})
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <ToolSurfaceHeader
                title={t("subjects.aiTools.tools.flashcards.title")}
                onBack={onBack}
                backLabel={t("common.back")}
                headingRef={headingRef}
            />

            {sources.length === 0 ? (
                <EmptyContent
                    title={t("subjects.aiTools.flashcards.emptyTitle")}
                    description={t("subjects.aiTools.flashcards.emptyDesc")}
                    onRetry={onGoResources}
                    retryLabel={t("subjects.aiTools.goResources")}
                />
            ) : !deck && !deckSwr.isMutating ? (
                <>
                    <SourcePicker
                        label={t("subjects.aiTools.pickSource")}
                        sources={sources}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                    />
                    {deckSwr.error ? (
                        <ErrorContent
                            title={t("subjects.aiTools.flashcards.errorTitle")}
                            description={t("subjects.aiTools.errorRetryHint")}
                            onRetry={generate}
                            retryLabel={t("subjects.aiTools.retry")}
                        />
                    ) : null}
                    <Button
                        variant="primary"
                        className="self-start"
                        isDisabled={!selected}
                        onPress={generate}
                    >
                        {t("subjects.aiTools.flashcards.generate")}
                    </Button>
                </>
            ) : deckSwr.isMutating ? (
                <Skeleton className="h-64 w-full rounded-large" />
            ) : done ? (
                <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 rounded-2xl border border-separator p-8 text-center">
                    <CheckCircleIcon
                        aria-hidden
                        focusable="false"
                        className="size-8 text-success"
                    />
                    <Typography type="h6" weight="bold">
                        {t("subjects.aiTools.flashcards.sessionDoneTitle")}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t("subjects.aiTools.flashcards.sessionDoneDesc", {
                            count: reviewedCount,
                        })}
                    </Typography>
                    <div className="mt-2 flex gap-2">
                        <Button variant="secondary" onPress={restart}>
                            {t("subjects.aiTools.flashcards.studyAgain")}
                        </Button>
                        <Button
                            variant="primary"
                            onPress={() => {
                                deckSwr.reset()
                                restart()
                            }}
                        >
                            {t("subjects.aiTools.flashcards.regenerate")}
                        </Button>
                    </div>
                </div>
            ) : card ? (
                <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
                    {/* deck/stats framing — the source + a maturity mix bar
                        (mastered · learning · new), mirroring FlashcardStatsStrip */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
                        <Typography type="body-sm" weight="medium" className="min-w-0 truncate">
                            {deck?.title}
                        </Typography>
                        <SegmentBar
                            max={cards.length}
                            ariaLabel={t("subjects.aiTools.flashcards.stats.barAria", {
                                mastered,
                                learning,
                                newCount,
                                total: cards.length,
                            })}
                            segments={[
                                {
                                    key: "mastered",
                                    label: t("subjects.aiTools.flashcards.stats.mastered"),
                                    value: mastered,
                                    color: "var(--success)",
                                },
                                {
                                    key: "learning",
                                    label: t("subjects.aiTools.flashcards.stats.learning"),
                                    value: learning,
                                    color: "var(--warning)",
                                },
                                {
                                    key: "new",
                                    label: t("subjects.aiTools.flashcards.stats.new"),
                                    value: newCount,
                                    color: "var(--default)",
                                },
                            ]}
                        />
                    </div>

                    {/* progress — "Thẻ i/total" + bar (mirrors StarCi review) */}
                    <ProgressMeter
                        value={currentIndex + 1}
                        max={cards.length}
                        label={t("subjects.aiTools.flashcards.cardProgress", {
                            current: currentIndex + 1,
                            total: cards.length,
                        })}
                    />

                    {/* current card meta: topic tags (StarCi shows level + tag chips) */}
                    {card.tags && card.tags.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                            {card.tags.map((tag) => (
                                <Chip key={tag} size="sm" variant="soft" color="default">
                                    {tag}
                                </Chip>
                            ))}
                        </div>
                    ) : null}

                    {/* flip card — question on the front, answer on the back */}
                    <button
                        type="button"
                        aria-label={t("subjects.aiTools.flashcards.flip")}
                        aria-pressed={revealed}
                        onClick={() => setRevealed((prev) => !prev)}
                        className="flex min-h-64 w-full flex-col items-center justify-center gap-3 rounded-3xl border border-separator bg-surface p-8 text-center outline-none transition-colors hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-focus"
                    >
                        <Typography
                            type="body-xs"
                            weight="medium"
                            className={cn(revealed ? "text-success" : "text-accent")}
                        >
                            {revealed
                                ? t("subjects.aiTools.flashcards.answerLabel")
                                : t("subjects.aiTools.flashcards.questionLabel")}
                        </Typography>
                        <Typography type="h5" weight="semibold">
                            {revealed ? card.definition : card.term}
                        </Typography>
                        <span className="flex items-center gap-1 text-muted">
                            <CursorClickIcon
                                className="size-3.5"
                                aria-hidden
                                focusable="false"
                            />
                            <Typography type="body-xs" color="muted">
                                {revealed
                                    ? t("subjects.aiTools.flashcards.flipBackHint")
                                    : t("subjects.aiTools.flashcards.flipHint")}
                            </Typography>
                        </span>
                    </button>

                    {/* reveal first, then grade recall (which advances) — mirrors
                        StarCi's reveal-gate: question side has prev + "show answer",
                        answer side shows the SM-2 rating row */}
                    {revealed ? (
                        <div className="flex flex-col gap-2">
                            <Typography type="body-xs" color="muted" align="center">
                                {t("subjects.aiTools.flashcards.rateHint")}
                            </Typography>
                            <div className="grid grid-cols-4 gap-2">
                                {SM2_GRADES.map((option) => {
                                    const streak = streaks[card.id] ?? 0
                                    const days = nextIntervalDays(option.grade, streak)
                                    const interval =
                                        days === 0
                                            ? t("subjects.aiTools.flashcards.intervalNow")
                                            : t("subjects.aiTools.flashcards.intervalDays", {
                                                count: days,
                                            })
                                    return (
                                        <button
                                            key={option.grade}
                                            type="button"
                                            onClick={() => onRate(option.grade)}
                                            className={cn(
                                                "flex flex-col items-center gap-0.5 rounded-xl border py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus",
                                                option.tone,
                                            )}
                                        >
                                            <Typography type="body-sm" weight="medium">
                                                {t(`subjects.aiTools.flashcards.rating.${option.labelKey}`)}
                                            </Typography>
                                            <Typography type="body-xs" color="muted">
                                                {interval}
                                            </Typography>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-3">
                            <Button
                                size="sm"
                                variant="secondary"
                                isDisabled={isFirst}
                                onPress={goPrev}
                            >
                                {t("subjects.aiTools.flashcards.previous")}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onPress={() => setRevealed(true)}
                            >
                                {t("subjects.aiTools.flashcards.showAnswer")}
                            </Button>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    )
}
