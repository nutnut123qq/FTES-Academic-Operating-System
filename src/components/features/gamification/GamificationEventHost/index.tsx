"use client"

import React, { useEffect, useRef, useState } from "react"
import { Modal, Typography, toast } from "@heroui/react"
import { useTranslations } from "next-intl"
import { StarIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useGetMyQuestsSwr } from "@/hooks/swr/api/rest/queries/useGetMyQuestsSwr"
import { useGetMyProgressionSwr } from "@/hooks/swr/api/rest/queries/useGetMyProgressionSwr"

/**
 * Fire a "+{coin} xu — {title}" toast the moment a quest's claimed count grows.
 *
 * Diff-based over the shared `useGetMyQuestsSwr` cache (no engine, no event bus):
 * a ref holds the last-seen `completedCount` per quest `code`. The FIRST fetch
 * only seeds the baseline — completions from before this mount are never toasted;
 * only an increase observed on a later 60s poll (coins auto-credit on a backend
 * worker) surfaces. Because every surface reads the ONE quest cache, mounting
 * this host once announces completions app-wide.
 */
const useQuestCompletionToasts = (): void => {
    const t = useTranslations("gamification")
    const { data } = useGetMyQuestsSwr()
    const seen = useRef<Map<string, number> | null>(null)

    useEffect(() => {
        if (!data) return
        const counts = new Map(data.quests.map((quest) => [quest.code, quest.completedCount]))
        // First fetch → seed the baseline silently (no toast for history).
        if (seen.current === null) {
            seen.current = counts
            return
        }
        for (const quest of data.quests) {
            const previous = seen.current.get(quest.code) ?? 0
            if (quest.completedCount > previous) {
                toast.success(t("quests.toast.questDone", { coin: quest.rewardCoin, title: quest.title }))
            }
        }
        seen.current = counts
    }, [data, t])
}

/**
 * Track the progression level and expose the new level once it increases, so the
 * caller can raise a celebratory moment.
 *
 * Diff-based over the shared `useGetMyProgressionSwr` cache: a ref holds the
 * last-seen level; the first fetch seeds it silently (an already-high level on
 * mount is not a "level-up"). A later increase (level accrues on the backend, the
 * hook polls 60s) sets the pending level; the caller clears it when the moment
 * closes.
 *
 * @returns The pending level-up level (or null) and a clear callback.
 */
const useLevelUpMoment = (): { level: number | null; clear: () => void } => {
    const { data } = useGetMyProgressionSwr()
    const previous = useRef<number | null>(null)
    const [level, setLevel] = useState<number | null>(null)

    useEffect(() => {
        if (!data) return
        if (previous.current === null) {
            previous.current = data.level
            return
        }
        if (data.level > previous.current) setLevel(data.level)
        previous.current = data.level
    }, [data])

    return { level, clear: () => setLevel(null) }
}

/**
 * Surfaces live gamification feedback from the REST snapshots — a non-blocking
 * "+{coin} xu — {title}" toast whenever a quest is completed, and a celebratory
 * MOMENT overlay when the viewer levels up. Both are pure feedback derived by
 * diffing the shared SWR caches (no mock engine, no localStorage): quests from
 * `useGetMyQuestsSwr`, level from `useGetMyProgressionSwr`. Guests fetch nothing,
 * so neither diff ever fires.
 *
 * The moment is a HeroUI `Modal` — it closes on Esc / backdrop / the close
 * trigger (keyboard-dismissable per spec). Mount once alongside any gamification
 * surface (LeaderboardShell) so completions observed there are shown.
 *
 * @param props - Optional className.
 */
export const GamificationEventHost = ({ className }: WithClassNames<undefined>) => {
    const t = useTranslations("gamification")
    useQuestCompletionToasts()
    const { level, clear } = useLevelUpMoment()

    return (
        <div className={className}>
            <Modal isOpen={level !== null} onOpenChange={(open) => !open && clear()}>
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog>
                            <Modal.CloseTrigger />
                            <Modal.Body className="flex flex-col items-center gap-3 py-8 text-center">
                                <StarIcon
                                    className="size-10 text-accent"
                                    weight="fill"
                                    aria-hidden
                                    focusable="false"
                                />
                                <Typography type="h5" weight="bold">
                                    {t("moment.levelUpTitle")}
                                </Typography>
                                {level !== null ? (
                                    <Typography type="body" color="muted">
                                        {t("moment.levelUpBody", { level })}
                                    </Typography>
                                ) : null}
                            </Modal.Body>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </div>
    )
}
