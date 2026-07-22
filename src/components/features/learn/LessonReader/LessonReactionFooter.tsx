"use client"

import React, { useCallback } from "react"
import { useTranslations } from "next-intl"
import { InteractionBar } from "@/components/reuseable/Discussion/InteractionBar"
import { ReactionType, type ReactionSummary } from "@/modules/api/graphql/queries/types/discussion"
import { useGetLessonReactionsSwr } from "@/hooks/swr/api/rest/queries/useGetLessonReactionsSwr"
import { usePutLessonReactionSwr } from "@/hooks/swr/api/rest/mutations/usePutLessonReactionSwr"
import { useDeleteLessonReactionSwr } from "@/hooks/swr/api/rest/mutations/useDeleteLessonReactionSwr"
import { LESSON_REACTION_LIKE, type LessonReactionSummaryView } from "@/modules/api/rest/course"

/**
 * Maps the backend `{viewCount, likeCount, myReaction}` onto the shared discussion
 * {@link ReactionSummary} the {@link InteractionBar} renders. The lesson endpoint only
 * supports LIKE today, so the single bucket is `Like` and `myReaction` collapses to
 * `Like | null`.
 */
export const toReactionSummary = (view: LessonReactionSummaryView): ReactionSummary => ({
    counts: view.likeCount > 0 ? [{ type: ReactionType.Like, count: view.likeCount }] : [],
    total: view.likeCount,
    myReaction: view.myReaction === LESSON_REACTION_LIKE ? ReactionType.Like : null,
    viewCount: view.viewCount,
})

/**
 * Lesson-level reaction + view count in the reading card foot — wired to the real
 * `GET/PUT/DELETE /courses/lessons/{id}/reactions` endpoints via SWR. Liking is optimistic:
 * the summary flips instantly (like ±1, active state) while the PUT/DELETE runs in the
 * background, and rolls back to the server truth if the request fails.
 *
 * PREVIEW viewers can read the counts (GET only needs PREVIEW) but cannot like (PUT needs
 * FULL access) — the control is disabled with an enroll tooltip so no doomed PUT is fired.
 */
export const LessonReactionFooter = ({
    contentId,
    accessLevel,
}: {
    contentId: string
    accessLevel: string | null
}) => {
    const t = useTranslations("learn")
    const reactionsSwr = useGetLessonReactionsSwr(contentId)
    const { trigger: like } = usePutLessonReactionSwr()
    const { trigger: unlike } = useDeleteLessonReactionSwr()

    // Only FULL access may like; PREVIEW (or unknown) can still read the counts.
    const canLike = accessLevel === "FULL"
    const view = reactionsSwr.data

    const toggle = useCallback(
        async (next: boolean) => {
            if (!canLike || !view) {
                return
            }
            const optimistic: LessonReactionSummaryView = {
                ...view,
                myReaction: next ? LESSON_REACTION_LIKE : null,
                likeCount: Math.max(0, view.likeCount + (next ? 1 : -1)),
            }
            try {
                await reactionsSwr.mutate(
                    async () =>
                        next
                            ? like({ lessonId: contentId })
                            : unlike({ lessonId: contentId }),
                    {
                        optimisticData: optimistic,
                        rollbackOnError: true,
                        revalidate: false,
                        populateCache: true,
                    },
                )
            } catch {
                // rollbackOnError already restored the previous summary; swallow so the
                // rejected mutate promise doesn't surface as an unhandled rejection.
            }
        },
        [canLike, view, reactionsSwr, like, unlike, contentId],
    )

    // The picker toggles: a non-null pick means "like", null means "remove like".
    const handleReact = useCallback(
        (type: ReactionType | null) => {
            void toggle(type !== null)
        },
        [toggle],
    )

    const summary = view ? toReactionSummary(view) : undefined

    return (
        <div className="mt-6 border-t border-default pt-4">
            <InteractionBar
                summary={summary}
                onReact={handleReact}
                viewCount={view?.viewCount}
                disabled={!canLike}
                disabledReason={!canLike ? t("reactions.likeGated") : undefined}
            />
        </div>
    )
}
