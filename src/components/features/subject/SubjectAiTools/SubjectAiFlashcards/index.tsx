"use client"

import React from "react"
import { Button, Typography, cn } from "@heroui/react"
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"

/** Spaced-repetition self-rating options (SM-2-lite, mock) — tone classes are static
 *  so Tailwind keeps them. Rating a card = advance to the next one. */
const FLASHCARD_RATINGS = [
    { key: "again", tone: "border-danger/40 text-danger hover:bg-danger/10" },
    { key: "hard", tone: "border-warning/40 text-warning hover:bg-warning/10" },
    { key: "good", tone: "border-accent/40 text-accent hover:bg-accent/10" },
    { key: "easy", tone: "border-success/40 text-success hover:bg-success/10" },
] as const

import { useQuerySubjectAiSourcesSwr } from "../../hooks/useQuerySubjectAiSourcesSwr"
import { useMutateSubjectAiFlashcardsSwr } from "../../hooks/useMutateSubjectAiFlashcardsSwr"
import { ToolSurfaceHeader } from "../ToolSurfaceHeader"
import { SourcePicker } from "../SourcePicker"

/** Props for {@link SubjectAiFlashcards}. */
export interface SubjectAiFlashcardsProps {
    subjectId: string
    subjectCode: string
    onBack: () => void
    onGoResources: () => void
}

/**
 * Flashcards tool surface: pick a source → generate a mock deck, browsable as a
 * flip deck (click/keyboard) with prev/next, a position indicator, and an end
 * state (restart / regenerate).
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
    const [index, setIndex] = React.useState(0)
    const [flipped, setFlipped] = React.useState(false)
    const [done, setDone] = React.useState(false)

    React.useEffect(() => {
        headingRef.current?.focus()
    }, [])

    const selected = sources.find((s) => s.id === selectedId) ?? null
    const deck = deckSwr.data ?? []
    const card = deck[index] ?? null

    const generate = async () => {
        if (!selected) return
        setIndex(0)
        setFlipped(false)
        setDone(false)
        try {
            await deckSwr.trigger({ subjectCode, sourceTitle: selected.title })
        } catch {
            // error rendered from deckSwr.error
        }
    }

    const go = (delta: number) => {
        setFlipped(false)
        setIndex((prev) => Math.min(Math.max(prev + delta, 0), deck.length - 1))
    }

    /** Self-rate the current card (spaced-repetition, mock) → advance, or finish the
     *  deck on the last card. The rating value itself is not persisted (no BE yet). */
    const rate = () => {
        setFlipped(false)
        if (index >= deck.length - 1) {
            setDone(true)
        } else {
            setIndex((prev) => prev + 1)
        }
    }

    const restart = () => {
        setIndex(0)
        setFlipped(false)
        setDone(false)
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
            ) : deck.length === 0 && !deckSwr.isMutating ? (
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
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-separator p-8 text-center">
                    <Typography type="h6" weight="bold">
                        {t("subjects.aiTools.flashcards.reviewDone", { total: deck.length })}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t("subjects.aiTools.flashcards.reviewDoneHint")}
                    </Typography>
                    <div className="mt-2 flex gap-2">
                        <Button variant="secondary" onPress={restart}>
                            {t("subjects.aiTools.flashcards.restart")}
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
                <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
                    {/* progress — "Thẻ i/total" + bar (STT 29D, mirrors StarCi review) */}
                    <div className="flex flex-col gap-1">
                        <Typography type="body-sm" weight="medium">
                            {t("subjects.aiTools.flashcards.cardProgress", {
                                current: index + 1,
                                total: deck.length,
                            })}
                        </Typography>
                        <ProgressMeter
                            value={index + 1}
                            max={deck.length}
                            aria-label={t("subjects.aiTools.flashcards.title")}
                        />
                    </div>

                    {/* flip card — question on the front, answer on the back */}
                    <button
                        type="button"
                        aria-label={t("subjects.aiTools.flashcards.flip")}
                        aria-pressed={flipped}
                        onClick={() => setFlipped((prev) => !prev)}
                        className="flex min-h-64 w-full flex-col items-center justify-center gap-3 rounded-3xl border border-separator bg-surface p-8 text-center outline-none transition-colors hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-focus"
                    >
                        <Typography
                            type="body-xs"
                            weight="medium"
                            className={cn(flipped ? "text-success" : "text-accent")}
                        >
                            {flipped
                                ? t("subjects.aiTools.flashcards.back")
                                : t("subjects.aiTools.flashcards.front")}
                        </Typography>
                        <Typography type="h5" weight="semibold">
                            {flipped ? card.definition : card.term}
                        </Typography>
                        {!flipped ? (
                            <Typography type="body-xs" color="muted">
                                {t("subjects.aiTools.flashcards.showAnswer")}
                            </Typography>
                        ) : null}
                    </button>

                    {/* flipped → spaced-repetition self-rating; else prev/next nav */}
                    {flipped ? (
                        <div className="flex flex-col gap-2">
                            <Typography type="body-xs" color="muted" align="center">
                                {t("subjects.aiTools.flashcards.selfRatePrompt")}
                            </Typography>
                            <div className="grid grid-cols-4 gap-2">
                                {FLASHCARD_RATINGS.map((r) => (
                                    <button
                                        key={r.key}
                                        type="button"
                                        onClick={rate}
                                        className={cn(
                                            "flex flex-col items-center gap-0.5 rounded-xl border py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus",
                                            r.tone,
                                        )}
                                    >
                                        <Typography type="body-sm" weight="medium">
                                            {t(`subjects.aiTools.flashcards.rating.${r.key}`)}
                                        </Typography>
                                        <Typography type="body-xs" color="muted">
                                            {t(`subjects.aiTools.flashcards.interval.${r.key}`)}
                                        </Typography>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex w-full items-center justify-between gap-2">
                            <Button
                                size="sm"
                                variant="tertiary"
                                isIconOnly
                                aria-label={t("subjects.aiTools.flashcards.prev")}
                                isDisabled={index === 0}
                                onPress={() => go(-1)}
                            >
                                <CaretLeftIcon className="size-5" aria-hidden focusable="false" />
                            </Button>
                            <Typography type="body-sm" color="muted">
                                {t("subjects.aiTools.flashcards.position", {
                                    current: index + 1,
                                    total: deck.length,
                                })}
                            </Typography>
                            <Button
                                size="sm"
                                variant="tertiary"
                                isIconOnly
                                aria-label={t("subjects.aiTools.flashcards.next")}
                                isDisabled={index >= deck.length - 1}
                                onPress={() => go(1)}
                            >
                                <CaretRightIcon className="size-5" aria-hidden focusable="false" />
                            </Button>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    )
}
