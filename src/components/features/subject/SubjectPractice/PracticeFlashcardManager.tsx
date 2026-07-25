"use client"

import React from "react"
import { Button, Input, TextArea, TextField, Typography } from "@heroui/react"
import { PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { useRestWithToast } from "@/modules/toast/hooks"
import type {
    FlashcardCardInput,
    FlashcardDeckView,
} from "@/modules/api/rest/subject/types"
import {
    useMutateAddFlashcardCardsSwr,
    useMutateCreateFlashcardDeckSwr,
    useMutateDeleteFlashcardDeckSwr,
} from "../hooks/useMutateSubjectFlashcardReviewSwr"

/**
 * Parses the bulk card editor: one card per line, `front | back`.
 *
 * Lines without a separator (or with an empty side) are dropped, so a stray blank line
 * or a header row never becomes a broken card. The BE caps a request at 500 cards.
 */
export const parseFlashcardLines = (text: string): Array<FlashcardCardInput> => {
    const cards: Array<FlashcardCardInput> = []
    for (const line of text.split("\n")) {
        const separator = line.indexOf("|")
        if (separator < 0) continue
        const front = line.slice(0, separator).trim()
        const back = line.slice(separator + 1).trim()
        if (front.length === 0 || back.length === 0) continue
        cards.push({ front, back })
    }
    return cards.slice(0, 500)
}

/** Props for {@link PracticeFlashcardManager}. */
export interface PracticeFlashcardManagerProps {
    /** Subject code (uppercased route segment). */
    code: string
    /** Current decks of the subject. */
    decks: Array<FlashcardDeckView>
    /** Called after any successful write so the caller can revalidate the deck payload. */
    onChanged: () => void
}

/**
 * Deck/card management for subject curators — rendered only when the BE reports
 * `canManage` (subject manager / curator / lecturer-moderator-contributor of this
 * subject), so the panel never appears for someone the API would 403.
 *
 * Covers what a curator needs to get a deck live: create a deck WITH its cards in one
 * request (bulk `front | back` lines), append more cards to an existing deck, and
 * delete a deck. Per-card editing is intentionally left out of this compact panel.
 */
export const PracticeFlashcardManager = ({
    code,
    decks,
    onChanged,
}: PracticeFlashcardManagerProps) => {
    const t = useTranslations("subjects")
    const runRest = useRestWithToast()
    const createDeck = useMutateCreateFlashcardDeckSwr()
    const addCards = useMutateAddFlashcardCardsSwr()
    const deleteDeck = useMutateDeleteFlashcardDeckSwr()

    const [title, setTitle] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [cardsText, setCardsText] = React.useState("")
    const [appendTo, setAppendTo] = React.useState<string | null>(null)
    const [appendText, setAppendText] = React.useState("")
    const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null)

    const parsed = parseFlashcardLines(cardsText)
    const parsedAppend = parseFlashcardLines(appendText)
    const busy = createDeck.isMutating || addCards.isMutating || deleteDeck.isMutating

    const submitDeck = async () => {
        const name = title.trim()
        if (name.length === 0 || busy) return
        const created = await runRest(
            () =>
                createDeck.trigger({
                    code,
                    title: name,
                    description: description.trim() || undefined,
                    cards: parsed.length > 0 ? parsed : undefined,
                }),
            { successMessage: t("practice.flashcards.createdToast") },
        )
        if (created !== null) {
            setTitle("")
            setDescription("")
            setCardsText("")
            onChanged()
        }
    }

    const submitCards = async (deckId: string) => {
        if (parsedAppend.length === 0 || busy) return
        const added = await runRest(
            () => addCards.trigger({ code, deckId, cards: parsedAppend }),
            { successMessage: t("practice.flashcards.addedToast", { count: parsedAppend.length }) },
        )
        if (added !== null) {
            setAppendText("")
            setAppendTo(null)
            onChanged()
        }
    }

    const removeDeck = async (deckId: string) => {
        if (busy) return
        const removed = await runRest(() => deleteDeck.trigger({ code, deckId }), {
            successMessage: t("practice.flashcards.deletedToast"),
        })
        setConfirmDelete(null)
        if (removed === true) {
            onChanged()
        }
    }

    return (
        <div className="flex flex-col gap-4 rounded-3xl border border-separator p-4">
            <Typography type="body" weight="semibold">
                {t("practice.flashcards.manageTitle")}
            </Typography>

            {decks.length === 0 ? (
                <Typography type="body-sm" color="muted">
                    {t("practice.flashcards.manageEmpty")}
                </Typography>
            ) : (
                <div className="flex flex-col gap-2">
                    {decks.map((deck) => (
                        <div
                            key={deck.id}
                            className="flex flex-col gap-2 rounded-2xl border border-separator p-3"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <Typography type="body-sm" weight="medium">
                                        {deck.title}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {t("practice.flashcards.deckMeta", {
                                            cards: deck.cardCount,
                                            due: deck.dueCount,
                                        })}
                                    </Typography>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    isDisabled={busy}
                                    onPress={() => {
                                        setAppendTo((current) => (current === deck.id ? null : deck.id))
                                        setAppendText("")
                                    }}
                                >
                                    <PlusIcon aria-hidden focusable="false" className="size-4" />
                                    {t("practice.flashcards.addCards")}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="tertiary"
                                    isDisabled={busy}
                                    onPress={() => setConfirmDelete(deck.id)}
                                >
                                    <TrashIcon aria-hidden focusable="false" className="size-4 text-danger" />
                                    {t("practice.flashcards.deleteDeck")}
                                </Button>
                            </div>

                            {confirmDelete === deck.id ? (
                                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-danger/40 bg-danger/5 p-3">
                                    <Typography type="body-sm" className="flex-1 text-danger">
                                        {t("practice.flashcards.deleteDeckConfirm")}
                                    </Typography>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        isDisabled={busy}
                                        onPress={() => setConfirmDelete(null)}
                                    >
                                        {t("practice.flashcards.cancel")}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        isPending={deleteDeck.isMutating}
                                        isDisabled={busy}
                                        onPress={() => void removeDeck(deck.id)}
                                    >
                                        {t("practice.flashcards.confirmDelete")}
                                    </Button>
                                </div>
                            ) : null}

                            {appendTo === deck.id ? (
                                <div className="flex flex-col gap-2">
                                    <TextField variant="secondary" className="w-full">
                                        <TextArea
                                            rows={4}
                                            value={appendText}
                                            onChange={(event) => setAppendText(event.target.value)}
                                            placeholder={t("practice.flashcards.cardsPlaceholder")}
                                            aria-label={t("practice.flashcards.cardsLabel")}
                                            className="resize-y"
                                            disabled={busy}
                                        />
                                    </TextField>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Typography type="body-xs" color="muted" className="flex-1">
                                            {t("practice.flashcards.cardsParsed", {
                                                count: parsedAppend.length,
                                            })}
                                        </Typography>
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            isPending={addCards.isMutating}
                                            isDisabled={busy || parsedAppend.length === 0}
                                            onPress={() => void submitCards(deck.id)}
                                        >
                                            {t("practice.flashcards.addCards")}
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-col gap-2 border-t border-separator pt-4">
                <Typography type="body-sm" weight="semibold">
                    {t("practice.flashcards.newDeck")}
                </Typography>
                <TextField className="w-full" aria-label={t("practice.flashcards.deckTitleLabel")}>
                    <Input
                        variant="secondary"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder={t("practice.flashcards.deckTitleLabel")}
                        aria-label={t("practice.flashcards.deckTitleLabel")}
                        disabled={busy}
                    />
                </TextField>
                <TextField className="w-full" aria-label={t("practice.flashcards.deckDescriptionLabel")}>
                    <Input
                        variant="secondary"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder={t("practice.flashcards.deckDescriptionLabel")}
                        aria-label={t("practice.flashcards.deckDescriptionLabel")}
                        disabled={busy}
                    />
                </TextField>
                <Typography type="body-xs" color="muted">
                    {t("practice.flashcards.cardsLabel")}
                </Typography>
                <TextField variant="secondary" className="w-full">
                    <TextArea
                        rows={5}
                        value={cardsText}
                        onChange={(event) => setCardsText(event.target.value)}
                        placeholder={t("practice.flashcards.cardsPlaceholder")}
                        aria-label={t("practice.flashcards.cardsLabel")}
                        className="resize-y"
                        disabled={busy}
                    />
                </TextField>
                <div className="flex flex-wrap items-center gap-2">
                    <Typography type="body-xs" color="muted" className="flex-1">
                        {t("practice.flashcards.cardsParsed", { count: parsed.length })}
                    </Typography>
                    <Button
                        size="sm"
                        variant="primary"
                        isPending={createDeck.isMutating}
                        isDisabled={busy || title.trim().length === 0}
                        onPress={() => void submitDeck()}
                    >
                        {t("practice.flashcards.create")}
                    </Button>
                </div>
            </div>
        </div>
    )
}
