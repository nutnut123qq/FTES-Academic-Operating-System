"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

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
                <Skeleton className="h-48 w-full rounded-large" />
            ) : card ? (
                <div className="flex flex-col items-center gap-3">
                    <button
                        type="button"
                        aria-label={t("subjects.aiTools.flashcards.flip")}
                        aria-pressed={flipped}
                        onClick={() => setFlipped((prev) => !prev)}
                        className="flex min-h-48 w-full flex-col items-center justify-center gap-2 rounded-large border border-separator p-6 text-center outline-none transition-colors hover:bg-default focus-visible:ring-2 focus-visible:ring-focus"
                    >
                        <Typography type="body-sm" color="muted">
                            {flipped
                                ? t("subjects.aiTools.flashcards.back")
                                : t("subjects.aiTools.flashcards.front")}
                        </Typography>
                        <Typography type="h6" weight="medium">
                            {flipped ? card.definition : card.term}
                        </Typography>
                    </button>

                    <div className="flex w-full items-center justify-between gap-2">
                        <Button
                            size="sm"
                            variant="tertiary"
                            isIconOnly
                            aria-label={t("subjects.aiTools.flashcards.prev")}
                            isDisabled={index === 0}
                            onPress={() => go(-1)}
                        >
                            <CaretLeftIcon
                                className="size-5"
                                aria-hidden
                                focusable="false"
                            />
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
                            <CaretRightIcon
                                className="size-5"
                                aria-hidden
                                focusable="false"
                            />
                        </Button>
                    </div>

                    {index >= deck.length - 1 ? (
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                onPress={() => {
                                    setIndex(0)
                                    setFlipped(false)
                                }}
                            >
                                {t("subjects.aiTools.flashcards.restart")}
                            </Button>
                            <Button
                                variant="primary"
                                onPress={() => {
                                    deckSwr.reset()
                                    setIndex(0)
                                    setFlipped(false)
                                }}
                            >
                                {t("subjects.aiTools.flashcards.regenerate")}
                            </Button>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}
