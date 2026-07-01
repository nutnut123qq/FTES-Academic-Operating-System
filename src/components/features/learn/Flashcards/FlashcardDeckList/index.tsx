"use client"

import React, { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import {
    Button,
    Card,
    Chip,
    Input,
    Pagination,
    TextField,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { FlashcardDeckListSkeleton } from "./FlashcardDeckListSkeleton"
import { queryFlashcardDecksByCourse } from "@/modules/api/graphql/queries/query-flashcard-decks-by-course"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { ChallengeDifficulty } from "@/modules/types/enums/challenge-difficulty"
import { type FlashcardDeckEntity } from "@/modules/types/entities/flashcard-deck"
import { type WithClassNames } from "@/modules/types/base/class-name"
import { useAppSelector } from "@/redux/hooks"

/** Decks shown per page in the topic list before the pager kicks in. */
const DECKS_PER_PAGE = 8

/** HeroUI Chip color per difficulty tier. */
const DIFFICULTY_COLOR: Record<ChallengeDifficulty, "success" | "warning" | "danger"> = {
    [ChallengeDifficulty.Easy]: "success",
    [ChallengeDifficulty.Medium]: "warning",
    [ChallengeDifficulty.Hard]: "danger",
    [ChallengeDifficulty.Insane]: "danger",
    [ChallengeDifficulty.Expert]: "danger",
}

/** Props for {@link FlashcardDeckList}. */
export interface FlashcardDeckListProps extends WithClassNames<undefined> {
    /** Called with the chosen deck id when the learner opens a deck. */
    onSelectDeck: (deckId: string) => void
    /** CTA label on each deck card. Defaults to the study label. */
    ctaLabel?: string
    /** Show the per-viewer spaced-repetition chrome (due chip + mastery meter).
     * The interview tab passes `false` — SR state is irrelevant when picking a
     * topic to drill aloud. Defaults to `true`. */
    showProgress?: boolean
}

/**
 * Lists the flashcard decks owned by the active course as a topic picker, shared
 * by both the study and interview tabs. Each deck card shows its difficulty + card
 * count and (in study mode) the viewer's due/mastery; the CTA label and SR chrome
 * are caller-controlled so the same list drives "Study" and "Interview". Reads the
 * owning course id from the course Redux slice; data states go through
 * {@link AsyncContent}.
 * @param props - {@link FlashcardDeckListProps}
 */
export const FlashcardDeckList = ({
    onSelectDeck,
    ctaLabel,
    showProgress = true,
}: FlashcardDeckListProps) => {
    const t = useTranslations()
    // read the owning course id from the store — no prop drilling needed
    const courseId = useAppSelector((state) => state.course.entity?.id)
    // live search query filtering decks by title/description
    const [query, setQuery] = useState("")
    // 1-based page for the client-side deck pager
    const [page, setPage] = useState(1)

    // fetch the decks for this course; null key suspends until the course hydrates
    const { data, isLoading, error, mutate } = useSWR(
        courseId ? ["flashcard-decks-by-course", courseId] : null,
        async () => {
            const response = await queryFlashcardDecksByCourse({
                request: { courseId: courseId as string },
            })
            return response.data?.flashcardDecksByCourse.data ?? null
        },
    )

    const decks = data ?? []

    // decks in display order, narrowed by the (case-insensitive) search query
    const filteredDecks = useMemo(() => {
        const sorted = [...decks].sort((prev, next) => prev.sortIndex - next.sortIndex)
        const normalized = query.trim().toLowerCase()
        if (!normalized) {
            return sorted
        }
        return sorted.filter((deck) => {
            const haystack = `${deck.title ?? ""} ${deck.description ?? ""}`.toLowerCase()
            return haystack.includes(normalized)
        })
    }, [decks, query])

    // paginate the filtered decks client-side
    const totalPages = Math.max(1, Math.ceil(filteredDecks.length / DECKS_PER_PAGE))
    // a new search shrinks the list — snap back to the first page
    useEffect(() => {
        setPage(1)
    }, [query])
    const pagedDecks = filteredDecks.slice((page - 1) * DECKS_PER_PAGE, page * DECKS_PER_PAGE)
    const pageNumbers = Array.from({ length: totalPages }, (_unused, index) => index + 1)

    return (
        <AsyncContent
            isLoading={(isLoading || !courseId) && decks.length === 0}
            skeleton={<FlashcardDeckListSkeleton />}
            isEmpty={decks.length === 0}
            emptyContent={{ title: t("flashcard.empty") }}
            error={decks.length === 0 ? error : undefined}
            errorContent={{
                title: t("flashcard.empty"),
                onRetry: () => { void mutate() },
            }}
        >
            <div className="flex flex-col gap-3">
                {/* search row: filter input (left) balanced by the result count (right).
                    The input sits on the page background, so it takes NO variant —
                    the default (clean bg-field) reads on the background; `secondary`
                    (grey fill) is for inputs on a card / bg-surface, not here. */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <TextField className="w-full sm:max-w-sm">
                        <Input
                            type="search"
                            aria-label={t("flashcard.searchPlaceholder")}
                            placeholder={t("flashcard.searchPlaceholder")}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </TextField>
                    <Typography type="body-sm" color="muted" className="shrink-0">
                        {t("flashcard.deck.found", { count: filteredDecks.length })}
                    </Typography>
                </div>

                {filteredDecks.length === 0 ? (
                    <Typography type="body-sm" color="muted">
                        {t("flashcard.searchEmpty", { query: query.trim() })}
                    </Typography>
                ) : (
                    <div className="flex flex-col gap-3">
                        {/* decks sorted by display order, filtered + paged */}
                        {/* Plain static card — the "Học" button is the only action
                            (no whole-card press): a card with an explicit CTA must
                            not also be clickable. */}
                        {pagedDecks.map((deck: FlashcardDeckEntity) => (
                            <Card key={deck.id}>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <Typography type="body" weight="medium">
                                            {deck.title}
                                        </Typography>
                                        <div className="flex items-center gap-2">
                                            {/* viewer's cards due in this deck (per-user) — study only */}
                                            {showProgress && deck.dueCount ? (
                                                <Chip size="sm" variant="soft" color="warning">
                                                    {t("flashcard.deck.due", { count: deck.dueCount })}
                                                </Chip>
                                            ) : null}
                                            <Chip
                                                size="sm"
                                                variant="soft"
                                                color={DIFFICULTY_COLOR[deck.difficulty]}
                                            >
                                                {t(`flashcard.difficulty.${deck.difficulty}`)}
                                            </Chip>
                                        </div>
                                    </div>
                                    {/* short description preview */}
                                    {deck.description ? (
                                        <Typography type="body-sm" color="muted" className="line-clamp-2">
                                            {deck.description}
                                        </Typography>
                                    ) : null}
                                    {/* per-viewer mastery (cards with repetitions >= 2) — study only */}
                                    {showProgress && (deck.cards?.length ?? 0) > 0 ? (
                                        <ProgressMeter
                                            value={deck.masteredCount ?? 0}
                                            max={deck.cards?.length ?? 0}
                                            label={t("flashcard.deck.mastered", {
                                                mastered: deck.masteredCount ?? 0,
                                                total: deck.cards?.length ?? 0,
                                            })}
                                        />
                                    ) : null}
                                    <div className="flex items-center justify-between gap-3">
                                        <Typography type="body-xs" color="muted">
                                            {t("flashcard.cardCount", { count: deck.cards?.length ?? 0 })}
                                        </Typography>
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onPress={() => onSelectDeck(deck.id)}
                                        >
                                            {ctaLabel ?? t("flashcard.study")}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {/* pager: left-aligned with the cards, hidden on a single page.
                            HeroUI Pagination bakes no hover/cursor → add per the rule. */}
                        {totalPages > 1 ? (
                            <Pagination
                                aria-label={t("common.pagination.navAria")}
                                className="justify-start"
                                size="sm"
                            >
                                <Pagination.Content className="flex flex-wrap justify-start gap-1.5">
                                    <Pagination.Item>
                                        <Pagination.Previous
                                            aria-label={t("common.pagination.previous")}
                                            isDisabled={page <= 1}
                                            className="cursor-pointer rounded-medium transition-colors hover:bg-default"
                                            onPress={() => setPage((current) => Math.max(1, current - 1))}
                                        >
                                            <Pagination.PreviousIcon />
                                        </Pagination.Previous>
                                    </Pagination.Item>
                                    {pageNumbers.map((pageNumber) => (
                                        <Pagination.Item key={pageNumber}>
                                            <Pagination.Link
                                                isActive={pageNumber === page}
                                                className="cursor-pointer rounded-medium transition-colors hover:bg-default data-[active=true]:hover:bg-accent"
                                                onPress={() => setPage(pageNumber)}
                                            >
                                                {pageNumber}
                                            </Pagination.Link>
                                        </Pagination.Item>
                                    ))}
                                    <Pagination.Item>
                                        <Pagination.Next
                                            aria-label={t("common.pagination.next")}
                                            isDisabled={page >= totalPages}
                                            className="cursor-pointer rounded-medium transition-colors hover:bg-default"
                                            onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
                                        >
                                            <Pagination.NextIcon />
                                        </Pagination.Next>
                                    </Pagination.Item>
                                </Pagination.Content>
                            </Pagination>
                        ) : null}
                    </div>
                )}
            </div>
        </AsyncContent>
    )
}
