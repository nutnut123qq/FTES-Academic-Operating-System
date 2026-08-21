"use client"

import React from "react"
import { TrophyIcon, ArrowRightIcon } from "@phosphor-icons/react"
import { Button, Chip, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { GoldenBoard } from "@/components/features/goldenboard/GoldenBoard"
import { useGetGoldenBoardLatestSwr } from "@/hooks/swr/api/rest/queries/useGetGoldenBoardLatestSwr"
import { localizeTermName } from "@/utils/term-name"

/**
 * "Bảng vàng FTES" / FTES Hall of Fame — the LATEST term's board, read from the BE
 * (`GET /api/v1/golden-board/latest`). Every name / photo / headline / achievement line is
 * admin-curated data now; nothing on this board is hardcoded in the FE any more (the old
 * `ACHIEVERS` array + `homeLanding.honor.people.*` i18n block are gone). The podium + list
 * rendering itself lives in {@link GoldenBoard}, shared verbatim with the `/goldenboard` page.
 *
 * ANONYMOUS-SAFE, and deliberately silent about its own async state: the section renders NOTHING
 * until it has rows. That single guard covers first load (no data yet), a BE failure, and the
 * legitimate 200-with-`entries: []` the BE returns before any board is curated — so a logged-out
 * visitor on the home page can never meet a spinner that never resolves or an error box, exactly
 * like the static version that returned null on an empty `ACHIEVERS`. The trade-off is a small
 * late paint of the band instead of a reserved skeleton, which is the right call for a marketing
 * section that is optional by nature.
 *
 * The term the board belongs to is surfaced as a chip under the subline — the board is per-term
 * now ("hiển thị theo kỳ mới nhất"), and without it the page would silently show one term's people
 * as if they were all-time.
 */
export const HonorBoardSection = () => {
    const t = useTranslations("homeLanding")
    const locale = useLocale()
    const router = useRouter()
    const { data } = useGetGoldenBoardLatestSwr()

    const entries = data?.entries ?? []
    // No rows = nothing to honour (loading / error / empty board all land here) → hide the band.
    if (entries.length === 0) return null

    const termLabel = data?.term
        ? localizeTermName(locale, data.term.name, data.term.code)
        : null

    return (
        <section className="relative isolate mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-24 left-1/4 size-96 rounded-full bg-warning/10 blur-3xl" />
                <div className="absolute right-0 top-1/3 size-80 rounded-full bg-warning/5 blur-3xl" />
            </div>

            <div className="mb-10 flex flex-col items-center gap-2 text-center">
                <TrophyIcon className="size-6 text-warning" aria-hidden focusable="false" />
                <Typography type="h3" weight="bold">
                    {t("honor.title")}
                </Typography>
                <Typography type="body" color="muted" className="max-w-2xl">
                    {t("honor.subline")}
                </Typography>
                {termLabel ? (
                    <Chip size="sm" variant="soft" color="warning">
                        {t("honor.term", { term: termLabel })}
                    </Chip>
                ) : null}
            </div>

            <GoldenBoard entries={entries} />

            <div className="mt-8 flex justify-center">
                <Button variant="secondary" onPress={() => router.push("/goldenboard")}>
                    {t("honor.cta")}
                    <ArrowRightIcon className="size-4" aria-hidden focusable="false" />
                </Button>
            </div>
        </section>
    )
}
