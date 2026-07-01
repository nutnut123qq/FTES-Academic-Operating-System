"use client"

import React, {
    useMemo,
} from "react"
import {
    Button,
    Typography,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    BookOpenIcon,
    FlagIcon,
    PuzzlePieceIcon,
} from "@phosphor-icons/react"
import {
    formatDateTime,
    getTimeAgoLabel,
    getTimeAgoMessage,
} from "@/modules/dayjs"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    toDifficulty,
} from "../../CourseOutline/map"
import { CourseLearningEventType } from "@/modules/api/graphql/queries/types/course-learning-history"
import type { CourseLearningHistoryItemData } from "@/modules/api/graphql/queries/types/course-learning-history"
import { useQueryCourseLearningHistorySwr } from "@/hooks/swr/api/graphql/queries/useQueryCourseLearningHistorySwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { DifficultyChip } from "@/components/blocks/chips/DifficultyChip"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { IconTile } from "@/components/blocks/identity/IconTile"
import { ListRow } from "@/components/blocks/lists/ListRow"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Props for {@link CourseDayTimeline}. */
export interface CourseDayTimelineProps extends WithClassNames<undefined> {
    /** Selected course RELAY GLOBAL ID (the `?course=` value, passed to the query). */
    courseGlobalId: string
    /** Lower-cased trimmed search query; filters events by label, client-side. */
    query: string
}

/** Event-type → entity icon (phosphor `*Icon`) shown as the row's leading tile. */
const EVENT_ICON: Record<CourseLearningEventType, typeof BookOpenIcon> = {
    [CourseLearningEventType.LessonRead]: BookOpenIcon,
    [CourseLearningEventType.ChallengePassed]: PuzzlePieceIcon,
    [CourseLearningEventType.MilestonePassed]: FlagIcon,
}

/** Event-type → IconTile tone. */
const EVENT_TONE = {
    [CourseLearningEventType.LessonRead]: "accent",
    [CourseLearningEventType.ChallengePassed]: "success",
    [CourseLearningEventType.MilestonePassed]: "warning",
} as const

/** A day bucket of learning events under a relative day header. */
interface DayGroup {
    /** Stable key (start-of-day ms as string). */
    key: string
    /** Header label ("Hôm nay" / "Hôm qua" / a formatted date). */
    label: string
    /** Events in this day, newest first. */
    items: Array<CourseLearningHistoryItemData>
}

/** Start-of-day epoch ms for a date (local). */
const startOfDayMs = (date: Date): number =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

/**
 * "Theo ngày" view — the viewer's per-course learning journal: every
 * `lessonRead` / `challengePassed` / `milestonePassed` event, newest first,
 * grouped under relative day headers (Hôm nay / Hôm qua / localized date). Each
 * row is an entity-icon tile + the label + a module/type subtitle + an optional
 * {@link DifficultyChip} + a relative timestamp. Drives its own cursor-paginated
 * SWR (load more) and filters by the shared search query, client-side. Every
 * data state goes through {@link AsyncContent}; empties center.
 *
 * @param props - {@link CourseDayTimelineProps}
 */
export const CourseDayTimeline = ({
    courseGlobalId,
    query,
    className,
}: CourseDayTimelineProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const {
        data,
        size,
        setSize,
        isLoading,
        isValidating,
        error,
        mutate,
    } = useQueryCourseLearningHistorySwr(courseGlobalId)

    // flatten every loaded page into one newest-first list
    const items = useMemo(
        () => (data ?? []).flatMap((page) => page.items),
        [data],
    )
    const hasMore = Boolean(data && data.length > 0 && data[data.length - 1].nextCursor !== null)
    const isLoadingMore = isValidating && Boolean(data) && size > 0

    // search filters loaded events by label, client-side
    const filtered = useMemo(
        () => (query ? items.filter((item) => item.label.toLowerCase().includes(query)) : items),
        [items, query],
    )

    // bucket the filtered events by local day
    const dayGroups = useMemo<Array<DayGroup>>(
        () => {
            const now = new Date()
            const todayMs = startOfDayMs(now)
            const dayMs = 86_400_000
            const groups: Array<DayGroup> = []
            for (const item of filtered) {
                const at = new Date(item.at)
                const dayMsValue = startOfDayMs(at)
                let label: string
                if (dayMsValue === todayMs) {
                    label = t("profileSettings.learning.day.today")
                } else if (dayMsValue === todayMs - dayMs) {
                    label = t("profileSettings.learning.day.yesterday")
                } else {
                    label = at.toLocaleDateString(locale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })
                }
                const key = String(dayMsValue)
                const last = groups[groups.length - 1]
                if (last && last.key === key) {
                    last.items.push(item)
                } else {
                    groups.push({ key, label, items: [item] })
                }
            }
            return groups
        },
        [
            filtered,
            locale,
            t,
        ],
    )

    return (
        <div className={className}>
            <AsyncContent
                isLoading={isLoading && items.length === 0}
                skeleton={(
                    <div className="flex flex-col gap-6">
                        {[0, 1].map((group) => (
                            <div key={group} className="flex flex-col gap-3">
                                <Skeleton.Typography type="body-xs" width="1/4" />
                                {[0, 1, 2].map((row) => (
                                    <Skeleton.ListRow key={row} withTrailing />
                                ))}
                            </div>
                        ))}
                    </div>
                )}
                isEmpty={items.length === 0}
                emptyContent={{
                    title: t("profileSettings.learning.day.empty"),
                    description: t("profileSettings.learning.day.emptyHint"),
                }}
                error={items.length === 0 ? error : undefined}
                errorContent={{
                    title: t("profileSettings.learning.outline.error"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("profileSettings.learning.loadMore"),
                }}
            >
                {filtered.length === 0 ? (
                // loaded but the current search matches no event
                    <EmptyContent title={t("profileSettings.learning.day.noMatch")} />
                ) : (
                    <div className="flex flex-col gap-6">
                        {dayGroups.map((group) => (
                            <div key={group.key} className="flex flex-col gap-3">
                                <Typography type="body-xs" color="muted" weight="medium">
                                    {group.label}
                                </Typography>
                                <div className="flex flex-col gap-2">
                                    {group.items.map((item) => {
                                        const Icon = EVENT_ICON[item.type]
                                        const relative = getTimeAgoLabel(getTimeAgoMessage(item.at), t)
                                        const subtitle = item.moduleTitle
                                        ?? t(`profileSettings.learning.day.eventType.${item.type}`)
                                        return (
                                            <ListRow
                                                key={item.id}
                                                leading={(
                                                    <IconTile
                                                        size="sm"
                                                        tone={EVENT_TONE[item.type]}
                                                        icon={<Icon aria-hidden focusable="false" />}
                                                    />
                                                )}
                                                title={item.label}
                                                subtitle={subtitle}
                                                meta={(
                                                    <>
                                                        {item.difficulty ? (
                                                            <DifficultyChip difficulty={toDifficulty(item.difficulty)} />
                                                        ) : null}
                                                        <Typography type="body-xs" color="muted">
                                                            <span title={formatDateTime(item.at, locale)}>{relative}</span>
                                                        </Typography>
                                                    </>
                                                )}
                                            />
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                        {hasMore ? (
                            <div className="flex justify-center">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    isPending={isLoadingMore}
                                    onPress={() => setSize(size + 1)}
                                >
                                    {t("profileSettings.learning.loadMore")}
                                </Button>
                            </div>
                        ) : null}
                    </div>
                )}
            </AsyncContent>
        </div>
    )
}
