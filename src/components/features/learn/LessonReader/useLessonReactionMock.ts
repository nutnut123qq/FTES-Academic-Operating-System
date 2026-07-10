"use client"

import { useCallback, useEffect, useState } from "react"
import {
    ReactionType,
    type ReactionCount,
    type ReactionSummary,
} from "@/modules/api/graphql/queries/types/discussion"

/**
 * FE-only MOCK lesson reaction store (no BE contract yet). The viewer's own pick is
 * persisted in localStorage per lesson; the base like-count + view-count are a
 * deterministic seed from the content id so they stay stable across reloads. Returns
 * the same `{ summary, react }` shape a real endpoint would, so swapping in REST later
 * is a one-file change. `ponytail: mock store, replace with a real content-reactions endpoint`.
 */

const STORAGE_PREFIX = "lessonReaction:"

/** Stable pseudo-count from a content id (djb2-ish), so seeds don't jump on reload. */
const hashSeed = (value: string): number => {
    let hash = 0
    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) >>> 0
    }
    return hash
}

export const useLessonReactionMock = (contentId: string) => {
    const [myReaction, setMyReaction] = useState<ReactionType | null>(null)

    // restore the viewer's persisted pick for this lesson
    useEffect(() => {
        const raw = window.localStorage.getItem(STORAGE_PREFIX + contentId)
        setMyReaction(raw ? (JSON.parse(raw) as { myReaction: ReactionType | null }).myReaction : null)
    }, [contentId])

    const react = useCallback(
        (type: ReactionType | null) => {
            // picking the active reaction again removes it
            setMyReaction((current) => {
                const next = type === current ? null : type
                window.localStorage.setItem(STORAGE_PREFIX + contentId, JSON.stringify({ myReaction: next }))
                return next
            })
        },
        [contentId],
    )

    const seed = hashSeed(contentId)
    const viewCount = 120 + (seed % 900)
    const baseLikes = Math.round(viewCount * 0.12)

    // fold the viewer's own pick into the aggregate
    const buckets = new Map<ReactionType, number>([[ReactionType.Like, baseLikes]])
    if (myReaction) {
        buckets.set(myReaction, (buckets.get(myReaction) ?? 0) + 1)
    }
    const counts: Array<ReactionCount> = [...buckets.entries()]
        .filter(([, count]) => count > 0)
        .map(([type, count]) => ({ type, count }))
    const total = counts.reduce((sum, bucket) => sum + bucket.count, 0)

    const summary: ReactionSummary = { counts, total, myReaction, viewCount }
    return { summary, react }
}
