"use client"

import React, { useMemo, useState } from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { ArrowLeftIcon, LockSimpleIcon, StackIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { RestError } from "@/modules/api/rest/client/client"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { Link } from "@/i18n/navigation"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { useQuerySubjectFlashcardsSwr } from "../hooks/useQuerySubjectFlashcardsSwr"
import type {
    FlashcardCardView,
    FlashcardDeckView,
} from "@/modules/api/rest/subject/types"

/** Where a reader goes to buy the membership that unlocks the paid decks. */
const MEMBERSHIP_HREF = "/dashboard?tab=plan"

interface FlashcardDeckListProps {
    /** Subject CODE (the practice routes key on the code, not the uuid). */
    subjectCode: string
    onBack: () => void
}

/**
 * The subject's flashcard shelf, and the study session that runs off it.
 *
 * The paywall is the BE's: a paid deck reaches this component with only `previewLimit`
 * cards and `locked = true`, so the session below simply runs out of cards and the upsell
 * takes over. Nothing here filters, blurs or hides a card the server already sent — that
 * would be a lock made of CSS, and the cards would still be one devtools panel away.
 *
 * `deck.cardCount` is the deck's REAL size even while locked; `deck.cards.length` is what
 * the reader may study. The two differ on purpose and the copy leans on both: "5 of 392".
 */
export const FlashcardDeckList = ({ subjectCode, onBack }: FlashcardDeckListProps) => {
    const t = useTranslations("subjects")
    const { view, isLoading, error, mutate } = useQuerySubjectFlashcardsSwr(subjectCode)
    const [openDeckId, setOpenDeckId] = useState<string | null>(null)

    /**
     * The deck endpoint is signed-in only (anonymous → 401) while the subject page itself is
     * public. Letting that 401 fall into the generic load error would hand a guest a "could
     * not load" box whose Retry button fails forever, with nothing anywhere saying "sign in"
     * — the exact trap the Coding module already documents. A guest gets the invitation.
     */
    const signedOut = error instanceof RestError && error.status === 401

    const openDeck = useMemo(
        () => view?.decks.find((deck) => deck.id === openDeckId) ?? null,
        [view, openDeckId],
    )

    if (openDeck) {
        return (
            <StudySession
                deck={openDeck}
                onBack={() => setOpenDeckId(null)}
            />
        )
    }

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Typography type="h5" weight="bold">
                    {t("practice.flashcards.title")}
                </Typography>
                <Button size="sm" variant="tertiary" className="shrink-0" onPress={onBack}>
                    <ArrowLeftIcon aria-hidden focusable="false" className="size-4" />
                    {t("practice.backToHub")}
                </Button>
            </div>

            <AsyncContent
                isLoading={isLoading && !view}
                skeleton={<DeckListSkeleton />}
                error={view || signedOut ? undefined : error}
                errorContent={{
                    title: t("practice.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("practice.retry"),
                }}
            >
                {signedOut ? (
                    <MembershipBanner signedOut />
                ) : view && view.decks.length === 0 ? (
                    <EmptyContent title={t("practice.flashcards.empty")} />
                ) : (
                    <div className="flex flex-col gap-3">
                        {view?.hasFullAccess === false ? <MembershipBanner /> : null}
                        {view?.decks.map((deck) => (
                            <DeckRow
                                key={deck.id}
                                deck={deck}
                                onOpen={() => setOpenDeckId(deck.id)}
                            />
                        ))}
                    </div>
                )}
            </AsyncContent>
        </div>
    )
}

/** One deck row: name, how much of it the reader may study, and the way in. */
const DeckRow = ({ deck, onOpen }: { deck: FlashcardDeckView; onOpen: () => void }) => {
    const t = useTranslations("subjects")

    return (
        <button
            type="button"
            onClick={onOpen}
            className="group flex w-full items-center gap-3 rounded-2xl border border-default p-4 text-start"
        >
            <StackIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Typography type="body" weight="medium" className="group-hover:underline" truncate>
                    {deck.title}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {deck.locked
                        ? t("practice.flashcards.previewMeta", {
                            preview: deck.cards.length,
                            total: deck.cardCount,
                        })
                        : t("practice.flashcards.cardMeta", { total: deck.cardCount })}
                </Typography>
            </div>
            {deck.locked ? (
                <Chip size="sm" color="warning" variant="soft" className="shrink-0">
                    <LockSimpleIcon aria-hidden focusable="false" className="size-3.5" />
                    {t("practice.flashcards.locked")}
                </Chip>
            ) : null}
        </button>
    )
}

/** The upsell. Shown once above the shelf, not repeated on every locked deck. */
const MembershipBanner = ({ signedOut = false }: { signedOut?: boolean }) => {
    const t = useTranslations("subjects")

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning bg-warning/10 p-4">
            <LockSimpleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-warning" />
            <Typography type="body-sm" className="min-w-0 flex-1">
                {signedOut
                    ? t("practice.flashcards.signedOut")
                    : t("practice.flashcards.upsell")}
            </Typography>
            <Link href={MEMBERSHIP_HREF} className="shrink-0 no-underline">
                <Button size="sm" variant="primary">
                    {t("practice.flashcards.subscribe")}
                </Button>
            </Link>
        </div>
    )
}

/**
 * A study run through one deck: show the front, reveal the back, move on.
 *
 * Reaching the end of a LOCKED deck is not an empty state — it is the moment the reader
 * has just felt the value and is the single best place to ask for the membership, so the
 * end card carries the CTA instead of a bare "done".
 */
const StudySession = ({ deck, onBack }: { deck: FlashcardDeckView; onBack: () => void }) => {
    const t = useTranslations("subjects")
    const [index, setIndex] = useState(0)
    const [revealed, setRevealed] = useState(false)

    const card: FlashcardCardView | undefined = deck.cards[index]
    const finished = !card

    const next = () => {
        setRevealed(false)
        setIndex((current) => current + 1)
    }

    return (
        <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Typography type="h5" weight="bold" truncate>
                    {deck.title}
                </Typography>
                <Button size="sm" variant="tertiary" className="shrink-0" onPress={onBack}>
                    <ArrowLeftIcon aria-hidden focusable="false" className="size-4" />
                    {t("practice.backToHub")}
                </Button>
            </div>

            {finished ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-default p-8 text-center">
                    <Typography type="body" weight="medium">
                        {deck.locked
                            ? t("practice.flashcards.previewOver", { preview: deck.cards.length, total: deck.cardCount })
                            : t("practice.flashcards.sessionDone")}
                    </Typography>
                    {deck.locked ? (
                        <Link href={MEMBERSHIP_HREF} className="no-underline">
                            <Button size="sm" variant="primary">
                                {t("practice.flashcards.subscribe")}
                            </Button>
                        </Link>
                    ) : (
                        <Button size="sm" variant="tertiary" onPress={() => { setIndex(0); setRevealed(false) }}>
                            {t("practice.flashcards.restart")}
                        </Button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <Typography type="body-xs" color="muted">
                        {t("practice.flashcards.position", {
                            index: index + 1,
                            total: deck.cards.length,
                        })}
                    </Typography>
                    <div
                        className={cn(
                            "flex min-h-[12rem] flex-col justify-center gap-4 rounded-2xl border border-default p-6",
                        )}
                    >
                        {/* Markdown, KHÔNG phải chữ thuần: có môn (Toán, Trung) ra đề bằng ẢNH —
                            cả câu hỏi lẫn phương án nằm trong một tấm hình — nên mặt thẻ lưu
                            `![](url)`. Render chữ thuần thì người học chỉ thấy một dòng link.
                            `math` bật vì phần lớn thẻ ảnh là môn Toán, thẻ chữ có công thức cũng
                            hiện đúng thay vì trơ ra `$...$`. */}
                        <MarkdownContent markdown={card.front} math />
                        {revealed ? (
                            <div className="border-t border-separator pt-4">
                                <MarkdownContent markdown={card.back} math />
                            </div>
                        ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {revealed ? (
                            <Button size="sm" variant="primary" onPress={next}>
                                {t("practice.flashcards.nextCard")}
                            </Button>
                        ) : (
                            <Button size="sm" variant="secondary" onPress={() => setRevealed(true)}>
                                {t("practice.flashcards.reveal")}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

/** Skeleton of the shelf — three rows at the real row height, so nothing jumps. */
const DeckListSkeleton = () => (
    <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[76px] w-full rounded-2xl" />
        ))}
    </div>
)
