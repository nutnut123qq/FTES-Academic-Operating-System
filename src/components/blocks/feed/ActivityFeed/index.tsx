"use client"

import React, {
    useMemo,
} from "react"
import {
    Typography,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    BookOpenIcon,
    BookmarkSimpleIcon,
    ChatCircleIcon,
    CodeIcon,
    FlagIcon,
    GraduationCapIcon,
    PulseIcon,
    SealCheckIcon,
    SparkleIcon,
    UserPlusIcon,
} from "@phosphor-icons/react"
import {
    formatDateTime,
    getTimeAgoLabel,
    getTimeAgoMessage,
} from "@/modules/dayjs"
import {
    ActivityAvatar,
} from "../ActivityAvatar"
import {
    EntityLink,
} from "../EntityLink"
import {
    FeedItem,
} from "../FeedItem"
import {
    ReactionBar,
} from "../ReactionBar"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { ActivityType } from "@/modules/api/graphql/queries/types/my-feed"
import type { QueryMyFeedItemData } from "@/modules/api/graphql/queries/types/my-feed"
import type { ReactionType } from "@/modules/api/graphql/queries/types/discussion"

/** Activity-type → badge icon (phosphor `*Icon`) shown over the actor avatar. */
const TYPE_ICON: Record<ActivityType, typeof BookOpenIcon> = {
    [ActivityType.LessonRead]: BookOpenIcon,
    [ActivityType.LessonBookmarked]: BookmarkSimpleIcon,
    [ActivityType.ChallengePassed]: SealCheckIcon,
    [ActivityType.CodingSolved]: CodeIcon,
    [ActivityType.MilestonePassed]: FlagIcon,
    [ActivityType.AiLabPassed]: SparkleIcon,
    [ActivityType.CourseEnrolled]: GraduationCapIcon,
    [ActivityType.DiscussionCommented]: ChatCircleIcon,
    [ActivityType.UserFollowed]: UserPlusIcon,
}

/** One rendered row: a single item, or a roll-up of consecutive milestone passes. */
interface FeedRow {
    /** Newest item in the row (drives actor + timestamp + icon). */
    head: QueryMyFeedItemData
    /** How many milestone passes were rolled up (1 for a normal row). */
    count: number
}

/** A day bucket of feed rows under a relative day header. */
interface DayGroup {
    /** Stable key (start-of-day ms). */
    key: string
    /** Header label ("Hôm nay" / "Hôm qua" / a formatted date). */
    label: string
    /** Rows in this day, newest first. */
    rows: Array<FeedRow>
}

/** Start-of-day epoch ms for a date (local). */
const startOfDayMs = (date: Date): number =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

/** Props for the {@link ActivityFeed} block. */
export interface ActivityFeedProps extends WithClassNames<undefined> {
    /** Activity items, newest first (already flattened across pages). */
    items: Array<QueryMyFeedItemData>
    /**
     * Resolve a global id to a press handler that navigates to the entity, or
     * `undefined` when unroutable. Navigation is the owning feature's concern, so
     * the block stays store/router-free and receives this wiring callback.
     */
    onResolve: (globalId: string | null | undefined) => (() => void) | undefined
    /**
     * React handler for a feed item — `(activityId, emotion | null)`. Omit to make
     * the feed READ-ONLY (no reaction picker). Per-item it is auto-suppressed when
     * the activity is the viewer's own (`isMine`) — you can't react to yourself.
     */
    onReact?: (activityId: string, type: ReactionType | null) => void
}

/**
 * The shared Facebook-style activity feed renderer: each row is an
 * {@link ActivityAvatar} (avatar + activity-type icon badge) beside a sentence
 * (actor + action + target, both clickable when routable) and a relative timestamp,
 * grouped under relative day headers (Hôm nay / Hôm qua / date). Consecutive
 * milestone passes roll up into one line; a null target falls back to a generic-noun
 * phrase — never blank (see `starci-feed.md`). Props-only: the owning FEATURE fetches
 * the items + supplies the route resolver, so the dashboard Explore feed and the
 * profile Activity timeline render identically from one place.
 *
 * @param props - {@link ActivityFeedProps}
 */
export const ActivityFeed = ({
    items,
    onResolve,
    onReact,
    className,
}: ActivityFeedProps) => {
    const t = useTranslations()
    const locale = useLocale()

    // roll up consecutive same-actor milestone passes, then bucket rows by day
    const dayGroups = useMemo<Array<DayGroup>>(
        () => {
            const rows: Array<FeedRow> = []
            for (const item of items) {
                const previous = rows[rows.length - 1]
                if (
                    item.type === ActivityType.MilestonePassed
                    && previous
                    && previous.head.type === ActivityType.MilestonePassed
                    && previous.head.actorGlobalId === item.actorGlobalId
                ) {
                    previous.count += 1
                    continue
                }
                rows.push({ head: item, count: 1 })
            }

            const now = new Date()
            const todayMs = startOfDayMs(now)
            const dayMs = 86_400_000
            // bucket by day key into an insertion-ordered Map so a given day appears
            // exactly once even when items aren't strictly day-monotonic (a later item
            // on an already-seen day appends to its group → no duplicate React keys)
            const groupByKey = new Map<string, DayGroup>()
            for (const row of rows) {
                const at = new Date(row.head.at)
                const dayMsValue = startOfDayMs(at)
                let label: string
                if (dayMsValue === todayMs) {
                    label = t("dashboard.feed.today")
                } else if (dayMsValue === todayMs - dayMs) {
                    label = t("dashboard.feed.yesterday")
                } else {
                    label = at.toLocaleDateString(locale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })
                }
                const key = String(dayMsValue)
                const existing = groupByKey.get(key)
                if (existing) {
                    existing.rows.push(row)
                } else {
                    groupByKey.set(key, { key, label, rows: [row] })
                }
            }
            return Array.from(groupByKey.values())
        },
        [
            items,
            locale,
            t,
        ],
    )

    /** Render one feed row as a FeedItem (avatar+badge · sentence · relative time). */
    const renderRow = (row: FeedRow, index: number) => {
        const { head, count } = row
        const Icon = TYPE_ICON[head.type] ?? PulseIcon
        // a "followed someone" row leads with the FOLLOWED user's avatar (the
        // interesting entity) + a follow-icon badge; other rows lead with the actor
        const followedUser = head.type === ActivityType.UserFollowed && head.targetLabel != null
            ? head.targetLabel
            : undefined
        const avatarUsername = followedUser ?? head.actorUsername
        // followed user's avatar isn't in the feed payload → generated from username
        const avatarUrl = followedUser ? null : head.actorAvatar
        const grouped = head.type === ActivityType.MilestonePassed && count > 1
        const noTarget = head.targetLabel == null
        // pick the phrasing: grouped roll-up · generic-noun fallback · normal
        const messageKey = grouped
            ? "milestonePassedGrouped"
            : noTarget
                ? `${head.type}NoTarget`
                : head.type
        const relative = getTimeAgoLabel(getTimeAgoMessage(head.at), t)
        return (
            <FeedItem
                key={`${head.actorGlobalId}-${head.at}-${index}`}
                leading={(
                    <ActivityAvatar
                        username={avatarUsername}
                        avatar={avatarUrl}
                        icon={<Icon aria-hidden focusable="false" weight="bold" />}
                    />
                )}
                timestamp={<span title={formatDateTime(head.at, locale)}>{relative}</span>}
                footer={(
                    <ReactionBar
                        count={head.reactionCount}
                        myReaction={head.myReaction}
                        // can't react to your own activity → read-only on own items
                        onReact={onReact && !head.isMine
                            ? (type) => onReact(head.id, type)
                            : undefined}
                    />
                )}
            >
                {t.rich(`dashboard.feed.${messageKey}`, {
                    count,
                    actor: () => (
                        <EntityLink
                            label={head.actorUsername}
                            onPress={onResolve(head.actorGlobalId)}
                        />
                    ),
                    target: () => (
                        <EntityLink
                            label={head.targetLabel ?? ""}
                            onPress={onResolve(head.targetGlobalId)}
                        />
                    ),
                })}
            </FeedItem>
        )
    }

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {dayGroups.map((group) => (
                <div key={group.key} className="flex flex-col gap-3">
                    <Typography type="body-xs" color="muted" weight="medium">
                        {group.label}
                    </Typography>
                    <div className="flex flex-col gap-3">
                        {group.rows.map(renderRow)}
                    </div>
                </div>
            ))}
        </div>
    )
}
