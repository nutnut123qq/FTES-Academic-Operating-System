"use client"

import React, { useMemo, useState } from "react"
import useSWR from "swr"
import { Chip, Input, Label, ListBox, ScrollShadow, TextField, Typography, cn } from "@heroui/react"
import { CardsThreeIcon, MicrophoneStageIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useFlashcardNav } from "../useFlashcardNav"
import { queryFlashcardDecksByCourse } from "@/modules/api/graphql/queries/query-flashcard-decks-by-course"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useAppSelector } from "@/redux/hooks"
import type { FlashcardDeckEntity } from "@/modules/types/entities/flashcard-deck"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link FlashcardStudyRail}. */
export type FlashcardStudyRailProps = WithClassNames<undefined>

/**
 * The flashcards LEFT RAIL — the same docs-style sidebar as the content-map rail
 * (pinned header + scroll region, full rail height), rendered by the learn layout
 * in the rail column. A mode switch (Study / Mock interview) + the course's decks
 * as a searchable nav list; all selection drives the URL (`useFlashcardNav`), so
 * the rail (layout) and the work pane (page) share one source of truth. Reads the
 * owning course id from the store; shares the deck SWR key with the page.
 * @param props - {@link FlashcardStudyRailProps}
 */
export const FlashcardStudyRail = ({ className }: FlashcardStudyRailProps) => {
    const t = useTranslations()
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const { mode, deckId, session, goMode, goDeck } = useFlashcardNav()
    const [query, setQuery] = useState("")

    // the deck highlighted in the rail = the open deck (none during the due session)
    const activeDeckId = session === "due" ? null : deckId

    const { data, isLoading, error, mutate } = useSWR(
        courseId ? ["flashcard-decks-by-course", courseId] : null,
        async () => {
            const response = await queryFlashcardDecksByCourse({
                request: { courseId: courseId as string },
            })
            return response.data?.flashcardDecksByCourse.data ?? null
        },
    )

    const decks = useMemo<Array<FlashcardDeckEntity>>(() => {
        const sorted = [...(data ?? [])].sort((prev, next) => prev.sortIndex - next.sortIndex)
        const normalized = query.trim().toLowerCase()
        if (!normalized) {
            return sorted
        }
        return sorted.filter((deck) =>
            `${deck.title ?? ""} ${deck.description ?? ""}`.toLowerCase().includes(normalized),
        )
    }, [data, query])

    return (
        <div className={cn("relative flex min-h-0 min-w-0 flex-col gap-3 p-6", className)}>
            {/* pinned header: mode switch + deck-search */}
            <div className="flex flex-col gap-3">
                <ListBox
                    aria-label={t("flashcard.title")}
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={[mode]}
                    onSelectionChange={(keys) => {
                        // controlled single-select → switch mode from the chosen key
                        const key = [...keys][0]
                        if (key === "study" || key === "interview") {
                            goMode(key)
                        }
                    }}
                    className="gap-1 p-0"
                >
                    <ListBox.Item
                        id="study"
                        textValue={t("flashcard.mode.study")}
                        className="cursor-pointer rounded-2xl px-3 py-2 data-[hovered=true]:bg-default-100 data-[selected=true]:bg-accent/10"
                    >
                        <span className="flex items-center gap-2">
                            <CardsThreeIcon className="size-4 shrink-0" aria-hidden focusable="false" />
                            <Typography type="body-sm" weight="medium">
                                {t("flashcard.mode.study")}
                            </Typography>
                        </span>
                    </ListBox.Item>
                    <ListBox.Item
                        id="interview"
                        textValue={t("flashcard.mode.interview")}
                        className="cursor-pointer rounded-2xl px-3 py-2 data-[hovered=true]:bg-default-100 data-[selected=true]:bg-accent/10"
                    >
                        <span className="flex items-center gap-2">
                            <MicrophoneStageIcon className="size-4 shrink-0" aria-hidden focusable="false" />
                            <Typography type="body-sm" weight="medium">
                                {t("flashcard.mode.interview")}
                            </Typography>
                        </span>
                    </ListBox.Item>
                </ListBox>

                {/* deck search — study mode only (interview is course-wide random) */}
                {mode === "study" ? (
                    <div className="flex flex-col gap-2">
                        <Label className="px-1 text-xs text-muted">{t("flashcard.decksLabel")}</Label>
                        <TextField>
                            <Input
                                type="search"
                                aria-label={t("flashcard.searchPlaceholder")}
                                placeholder={t("flashcard.searchPlaceholder")}
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </TextField>
                    </div>
                ) : null}
            </div>

            {/* scroll region: the deck nav list (study mode only) */}
            {mode === "study" ? (
                <ScrollShadow
                    hideScrollBar
                    className="-mx-1 min-h-0 min-w-0 flex-1 overflow-y-auto px-1"
                >
                    <AsyncContent
                        isLoading={(isLoading || !courseId) && (data ?? []).length === 0}
                        skeleton={
                            <div className="flex flex-col gap-1">
                                {[0, 1, 2, 3, 4].map((index) => (
                                    <Skeleton key={index} className="h-9 w-full rounded-2xl" />
                                ))}
                            </div>
                        }
                        isEmpty={decks.length === 0}
                        emptyContent={{
                            title: query.trim()
                                ? t("flashcard.searchEmpty", { query: query.trim() })
                                : t("flashcard.empty"),
                        }}
                        error={(data ?? []).length === 0 ? error : undefined}
                        errorContent={{
                            title: t("flashcard.empty"),
                            onRetry: () => { void mutate() },
                        }}
                    >
                        <ListBox
                            aria-label={t("flashcard.decksLabel")}
                            selectionMode="single"
                            selectedKeys={activeDeckId ? [activeDeckId] : []}
                            onSelectionChange={(keys) => {
                                // controlled single-select → open the chosen deck
                                const key = [...keys][0]
                                if (typeof key === "string") {
                                    goDeck(key)
                                }
                            }}
                            className="gap-1 p-0"
                        >
                            {decks.map((deck) => (
                                <ListBox.Item
                                    key={deck.id}
                                    id={deck.id}
                                    textValue={deck.title}
                                    className="cursor-pointer rounded-2xl px-3 py-2 data-[hovered=true]:bg-default-100 data-[selected=true]:bg-accent/10"
                                >
                                    <span className="flex w-full min-w-0 items-center justify-between gap-2">
                                        <Typography type="body-sm" className="min-w-0 flex-1 truncate">
                                            {deck.title}
                                        </Typography>
                                        {deck.dueCount ? (
                                            <Chip
                                                size="sm"
                                                variant="secondary"
                                                color="warning"
                                                className="shrink-0 bg-warning/10 text-warning"
                                            >
                                                {deck.dueCount}
                                            </Chip>
                                        ) : null}
                                    </span>
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </AsyncContent>
                </ScrollShadow>
            ) : null}
        </div>
    )
}
