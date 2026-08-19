"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button, Modal, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { FtesMascot } from "@/components/reuseable/FtesMascot"
import { useGetMyBadgesSwr } from "@/hooks/swr/api/rest/queries/useGetMyBadgesSwr"
import { useGetBadgeCatalogSwr } from "@/hooks/swr/api/rest/queries/useGetBadgeCatalogSwr"

/** A badge the viewer just earned, queued for its own celebration moment. */
interface Unlocked {
    code: string
    /** Human name carried on the earned-badge row, so the moment has a title even
     *  before the catalog (art + how-earned) resolves. */
    name: string
}

/**
 * Celebration MOMENT for a freshly-unlocked achievement — the "bùm, bạn vừa đạt X"
 * pop-up the level-up moment always promised for `badge.awarded` but never had.
 *
 * Diff-based over the shared `useGetMyBadgesSwr` cache (no event bus): a ref holds
 * the set of badge codes seen so far. The FIRST fetch only SEEDS that baseline —
 * badges earned before this mount are never celebrated; only a code that appears on
 * a LATER revalidation (the award lands on a backend worker, the FE picks it up when
 * the badge list next refetches on focus/navigation) opens a moment. Because every
 * surface reads the ONE badge cache, mounting this host once (app-wide in the shell)
 * announces unlocks wherever the viewer happens to be.
 *
 * The earned list (`BadgeView`) carries no icon, so the badge ART + "how you earned
 * it" line come from the catalog — fetched ONLY while a celebration is pending (the
 * `useGetBadgeCatalogSwr(enabled)` gate), so an idle session pays for nothing. The
 * title shows immediately from the earned row; the art fades in when the catalog
 * resolves, falling back to the cheering mascot if the badge has no artwork yet.
 *
 * Guests never fetch (both hooks are auth-gated), so the baseline stays null and no
 * moment ever fires for a signed-out viewer.
 */
export const BadgeUnlockHost = () => {
    const t = useTranslations("gamification")
    const { data: badges } = useGetMyBadgesSwr()
    /** Codes already accounted for; `null` until the first fetch seeds the baseline. */
    const seen = useRef<Set<string> | null>(null)
    /** Unlocks waiting to be celebrated, one modal at a time (front = current). */
    const [queue, setQueue] = useState<Array<Unlocked>>([])
    const current = queue[0] ?? null

    useEffect(() => {
        // Sign-out / auth-gate flushes the cache to `undefined` — drop the baseline so
        // the NEXT viewer's first fetch reseeds silently instead of diffing against the
        // previous account's badges (which would fire phantom unlock moments).
        if (!badges) {
            seen.current = null
            return
        }
        if (seen.current === null) {
            seen.current = new Set(badges.map((b) => b.code))
            return
        }
        const fresh = badges.filter((b) => !seen.current!.has(b.code))
        if (fresh.length === 0) {
            return
        }
        fresh.forEach((b) => seen.current!.add(b.code))
        setQueue((prev) => [...prev, ...fresh.map((b) => ({ code: b.code, name: b.name }))])
    }, [badges])

    // Catalog (art + description) is only worth fetching while a moment is on screen.
    const { data: catalog } = useGetBadgeCatalogSwr(current !== null)
    const item = current ? catalog?.items.find((i) => i.code === current.code) : undefined

    // Advance to the next queued unlock (or close when the queue drains).
    const dismiss = () => setQueue((prev) => prev.slice(1))

    return (
        <Modal isOpen={current !== null} onOpenChange={(open) => !open && dismiss()}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Body className="flex flex-col items-center gap-3 py-8 text-center">
                            {/* The badge ARTWORK is the hero of the moment; the cheering mascot
                                stands in until the catalog resolves (or if the badge has no art). */}
                            {item?.iconUrl ? (
                                <img
                                    src={item.iconUrl}
                                    alt=""
                                    className="size-28 object-contain drop-shadow-md"
                                />
                            ) : (
                                <FtesMascot pose="cheer" size="lg" />
                            )}
                            <Typography
                                type="body-xs"
                                weight="medium"
                                className="uppercase tracking-wide text-accent"
                            >
                                {t("moment.badgeUnlockedKicker")}
                            </Typography>
                            {current ? (
                                <Typography type="h5" weight="bold">
                                    {current.name}
                                </Typography>
                            ) : null}
                            {item?.description ? (
                                <Typography type="body-sm" color="muted">
                                    {item.description}
                                </Typography>
                            ) : null}
                            <Button variant="primary" onPress={dismiss} className="mt-2">
                                {t("moment.badgeUnlockedCta")}
                            </Button>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}

export default BadgeUnlockHost
