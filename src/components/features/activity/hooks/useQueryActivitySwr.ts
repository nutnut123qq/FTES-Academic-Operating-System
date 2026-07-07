"use client"

import useSWR from "swr"
import { getActivityTimeline, getActivityTypes } from "@/modules/api/rest/activity"
import { useAppSelector } from "@/redux/hooks"

/** The kinds of activity the engine emits — each maps to an icon + i18n label. */
export type ActivityKind =
    | "courseEnrolled"
    | "lessonCompleted"
    | "resourceUploaded"
    | "questionPosted"
    | "badgeEarned"
    | "coinEarned"
    | "eventJoined"
    | "groupJoined"
    | "other"

/** One row of the user activity timeline. */
export interface ActivityItem {
    id: string
    kind: ActivityKind
    text: string
    /** ISO timestamp; rendered as relative time in the feed. */
    time: string
}

// The BE activity engine emits ~55 dotted event types (design §18); the FE surface
// buckets them into a handful of icon-bearing kinds. Anything unmapped falls back
// to "other" (generic pulse icon) so every real event still renders.
const KIND_BY_TYPE: Record<string, ActivityKind> = {
    "course.enrolled": "courseEnrolled",
    "lesson.completed": "lessonCompleted",
    "lesson.preview.started": "lessonCompleted",
    "community.post.created": "questionPosted",
    "community.comment.created": "questionPosted",
    "community.answer.accepted": "questionPosted",
    "answer.accepted": "questionPosted",
    "badge.earned": "badgeEarned",
    "gamification.badge.awarded": "badgeEarned",
    "gamification.level.up": "badgeEarned",
    "gamification.streak.milestone": "badgeEarned",
    "coin.earned": "coinEarned",
    "coin.spent": "coinEarned",
    "coin.adjusted": "coinEarned",
    "gamification.reward.claimed": "coinEarned",
    "challenge.reward.granted": "coinEarned",
    "event.joined": "eventJoined",
    "event.registration.confirmed": "eventJoined",
    "event.checkin.recorded": "eventJoined",
    "group.joined": "groupJoined",
}

const toKind = (type: string): ActivityKind => KIND_BY_TYPE[type] ?? "other"

/**
 * Loads the signed-in viewer's activity timeline from the real Activity Engine
 * REST API (`GET /activities?userId=…`). The BE event carries a dotted `type` +
 * ref ids but no rendered sentence, so each row's text is the localized
 * description from the `/activities/types` catalog (falling back to the raw type).
 */
export const useQueryActivitySwr = () => {
    const viewerId = useAppSelector((state) => state.user.user?.id)
    const { data, isLoading, error, mutate } = useSWR(
        viewerId ? ["GET_ACTIVITY_TIMELINE", viewerId] : null,
        async (): Promise<Array<ActivityItem>> => {
            const [page, types] = await Promise.all([
                getActivityTimeline({ userId: viewerId, limit: 30 }),
                getActivityTypes(),
            ])
            const describe = new Map(types.map((t) => [t.type, t.description]))
            return (page.items ?? []).map((event) => ({
                id: event.eventId,
                kind: toKind(event.type),
                text: describe.get(event.type) || event.type,
                time: event.occurredAt,
            }))
        },
    )
    return { activity: data ?? [], isLoading, error, mutate }
}
