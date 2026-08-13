"use client"

import React from "react"
import { TrophyIcon } from "@phosphor-icons/react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { usePathname, useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { BackLink } from "@/components/blocks/navigation/BackLink"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useGetGoldenBoardForTermSwr } from "@/hooks/swr/api/rest/queries/useGetGoldenBoardForTermSwr"
import { useGetGoldenBoardLatestSwr } from "@/hooks/swr/api/rest/queries/useGetGoldenBoardLatestSwr"
import { useGetGoldenBoardTermsSwr } from "@/hooks/swr/api/rest/queries/useGetGoldenBoardTermsSwr"
import type { GoldenBoardTermOptionView } from "@/modules/api/rest/course"
import { GoldenBoard, GoldenBoardSkeleton } from "../GoldenBoard"

/** Query-string key the picked term is mirrored to (`/goldenboard?term=SP26`). */
export const TERM_QUERY_KEY = "term"

/**
 * Is this term option the one currently on screen? The URL may carry either form the BE accepts
 * (id or readable code), and with no `?term=` at all the board on screen is whatever
 * `/golden-board/latest` resolved to — so match on BOTH keys, never on the raw string alone.
 */
export const isTermSelected = (
    term: Pick<GoldenBoardTermOptionView, "id" | "code">,
    urlTerm: string | null,
    latestTermId: string | null | undefined,
): boolean =>
    urlTerm ? urlTerm === term.id || urlTerm === term.code : term.id === latestTermId

/** Label for a term chip — the readable name, falling back to the code. */
const termLabel = (term: Pick<GoldenBoardTermOptionView, "code" | "name">): string =>
    term.name || term.code

/**
 * `/goldenboard` — the Bảng vàng browser: pick a term, see that term's board.
 *
 * Data:
 *  - `GET /golden-board/terms` feeds the picker. It only returns terms that HAVE a board, so the
 *    page never offers a dead option and never probes term-by-term.
 *  - No `?term=` → `GET /golden-board/latest`, i.e. the BE's own "latest term" rule (prefers the
 *    ACTIVE term, then the most recently started one), NOT simply the first picker option — the
 *    home page shows that same board, so the default here matches what the visitor just clicked
 *    away from, and SWR reuses the cached response.
 *  - `?term=<id|code>` → `GET /golden-board/terms/{term}`.
 *
 * The picked term lives in the URL (`router.replace`, no scroll jump, no history entry per click),
 * so any term's board is a shareable link. Three degenerate cases are handled explicitly: no term
 * has a board at all, the picked term exists but has no rows yet (BE: 200 + empty), and a bad
 * `?term=` in the URL (BE: `TERM_NOT_FOUND`) — the last one keeps the picker on screen with a
 * "pick another term" message instead of blanking the page.
 *
 * Fully ANONYMOUS: all three endpoints are `permitAll` on the BE.
 */
export const GoldenBoardPage = () => {
    const t = useTranslations("goldenboard")
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const urlTerm = searchParams.get(TERM_QUERY_KEY)

    const termsSwr = useGetGoldenBoardTermsSwr()
    // Exactly ONE board request is ever in flight: the URL decides which of the two is enabled.
    const latestSwr = useGetGoldenBoardLatestSwr(!urlTerm)
    const termSwr = useGetGoldenBoardForTermSwr(urlTerm)
    const boardSwr = urlTerm ? termSwr : latestSwr

    const terms = termsSwr.data ?? []
    const board = boardSwr.data
    const entries = board?.entries ?? []
    const currentTerm = board?.term ?? null

    const onPickTerm = (term: GoldenBoardTermOptionView) => {
        const params = new URLSearchParams(searchParams.toString())
        // Prefer the readable code in the URL (`?term=SP26`); the BE resolves either form.
        params.set(TERM_QUERY_KEY, term.code || term.id)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    // First paint has neither list nor board yet; a cached board keeps the page live on re-fetch.
    const isFirstLoad = (termsSwr.isLoading && !termsSwr.data) || (boardSwr.isLoading && !board)
    const boardError = urlTerm ? termSwr.error : latestSwr.error
    // A failing `?term=` means TERM_NOT_FOUND in practice (a stale/typo'd shared link) and gets the
    // "pick another term" copy; a failing DEFAULT board is the BE being unreachable, which must not
    // be reported as a bad term the visitor never typed.
    const isUnknownTermError = Boolean(urlTerm && boardError)
    const hasNoBoardAnywhere =
        !isFirstLoad && !boardError && terms.length === 0 && entries.length === 0

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            {/* Reached from the home-page Hall of Fame CTA (and from shared links) — step back
                through real history; a direct visit falls back to the landing page. */}
            <BackLink fallbackHref="/home" />

            <div className="flex flex-col items-center gap-2 text-center">
                <TrophyIcon className="size-6 text-warning" aria-hidden focusable="false" />
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted" className="max-w-2xl">
                    {t("subtitle")}
                </Typography>
            </div>

            {/* term picker — static chrome, stays outside the board's async switch so the visitor
                can always pick their way out of an empty / unknown term */}
            {terms.length > 0 ? (
                <div className="flex flex-col items-center gap-2">
                    <Typography type="body-sm" color="muted">
                        {t("pickTerm")}
                    </Typography>
                    <div className="flex flex-wrap justify-center gap-2">
                        {terms.map((term) => {
                            const selected = isTermSelected(term, urlTerm, latestSwr.data?.term?.id)
                            return (
                                <Button
                                    key={term.id}
                                    size="sm"
                                    variant={selected ? "secondary" : "ghost"}
                                    aria-current={selected ? "true" : undefined}
                                    onPress={() => onPickTerm(term)}
                                >
                                    {termLabel(term)}
                                    <Chip size="sm" variant="soft" color="warning">
                                        {term.entryCount}
                                    </Chip>
                                </Button>
                            )
                        })}
                    </div>
                </div>
            ) : null}

            {currentTerm ? (
                <Typography type="body" weight="semibold" align="center">
                    {t("boardOfTerm", { term: currentTerm.name || currentTerm.code })}
                </Typography>
            ) : null}

            <AsyncContent
                isLoading={isFirstLoad}
                skeleton={
                    <div className="flex w-full flex-col gap-6">
                        <div className="flex justify-center gap-2">
                            {[0, 1, 2].map((chip) => (
                                <Skeleton key={chip} className="h-8 w-24 rounded-full" />
                            ))}
                        </div>
                        <GoldenBoardSkeleton />
                    </div>
                }
                error={boardError}
                errorContent={
                    isUnknownTermError
                        ? {
                            // The picker above stays on screen, and the action drops `?term=`.
                            title: t("unknownTerm.title"),
                            description: t("unknownTerm.description"),
                            onRetry: () => router.replace(pathname, { scroll: false }),
                            retryLabel: t("unknownTerm.action"),
                        }
                        : {
                            title: t("loadFailed.title"),
                            description: t("loadFailed.description"),
                            onRetry: () => void latestSwr.mutate(),
                            retryLabel: t("loadFailed.action"),
                        }
                }
                isEmpty={entries.length === 0}
                emptyContent={
                    hasNoBoardAnywhere
                        ? { title: t("empty.title"), description: t("empty.description") }
                        : { title: t("emptyTerm.title"), description: t("emptyTerm.description") }
                }
            >
                <GoldenBoard entries={entries} />
            </AsyncContent>
        </div>
    )
}
