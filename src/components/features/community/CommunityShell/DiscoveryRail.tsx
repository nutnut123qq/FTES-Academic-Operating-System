"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { CalendarIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { InitialsAvatar } from "@/components/blocks/identity/InitialsAvatar"
import { CommunityLiveChatRail } from "@/components/features/community/CommunityLiveChat"
import { TYPE_ICON } from "@/components/features/event/typeIcons"
import { useQueryLeaderboardSwr } from "@/components/features/gamification/hooks/useQueryLeaderboardSwr"
import { formatXpShort } from "@/utils/xp-format"
import { useQueryUpcomingEventsSwr, type UpcomingEvent } from "../hooks/useQueryUpcomingEventsSwr"

/** One discovery panel shell: title row (+ optional see-all link) over content. */
const RailPanel = ({
    title,
    seeAllHref,
    seeAllLabel,
    children,
}: {
    title: string
    seeAllHref?: string
    seeAllLabel?: string
    children: React.ReactNode
}) => (
    <section className="flex flex-col gap-2 rounded-3xl border border-separator bg-surface p-4">
        <Typography type="body-sm" weight="semibold">
            {title}
        </Typography>
        {children}
        {seeAllHref && seeAllLabel ? (
            <Link
                href={seeAllHref}
                className="group flex items-center gap-0.5 self-start text-xs text-accent no-underline hover:underline"
            >
                {seeAllLabel}
                <CaretRightIcon
                    aria-hidden
                    focusable="false"
                    className="size-3 transition-transform group-hover:translate-x-0.5"
                />
            </Link>
        ) : null}
    </section>
)

/** Rail chỉ vừa 5 dòng — phần còn lại đi qua link "Xem tất cả" của panel. */
const RAIL_LEADERS = 5

/** Skeleton khớp 5 dòng xếp hạng — cùng ô hạng, cùng avatar tròn, cùng một dòng tên. */
const TopLeadersSkeleton = () => (
    <div className="flex flex-col gap-1">
        {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center gap-2 p-1">
                <Skeleton className="h-3 w-4 shrink-0 rounded" />
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                    <Skeleton.Typography type="body-xs" width="2/3" />
                </div>
                <Skeleton className="h-3 w-8 shrink-0 rounded" />
            </div>
        ))}
    </div>
)

/**
 * Top 5 bảng xếp hạng toàn sàn — dữ liệu THẬT từ `leaderboard(scope: GLOBAL)` qua
 * `useQueryLeaderboardSwr`, dùng chung cache SWR với trang `/leaderboard` và thẻ dashboard
 * "Top học viên" nên rail không phát sinh request thứ hai.
 *
 * Rỗng là trạng thái nghỉ HỢP LỆ và có hai đường vào: khách chưa đăng nhập (hook không gọi
 * query, `isLoading` cũng false) và mùa chưa trao XP nào (ZSET rỗng). Câu rỗng vì thế phải
 * đúng cho cả hai — đừng viết "chưa có ai" hay "đăng nhập để xem".
 *
 * ponytail: bảng chỉ đọc — không phân trang, không lọc, hàng không bấm được. Rail hẹp nên
 * mỗi dòng chỉ mang hạng · avatar chữ cái · tên · EXP rút gọn; đường đi tiếp nằm ở link
 * "Xem tất cả". BE không trả level từng người nên không có dòng level.
 */
const TopLeaders = () => {
    const t = useTranslations("communityHub")
    const { board, myUserId, isLoading, error, mutate } = useQueryLeaderboardSwr()
    const leaders = board.slice(0, RAIL_LEADERS)

    return (
        <AsyncContent
            isLoading={isLoading && leaders.length === 0}
            skeleton={<TopLeadersSkeleton />}
            error={leaders.length === 0 ? error : undefined}
            errorContent={{
                title: t("rail.leaderboardError"),
                retryLabel: t("states.retry"),
                onRetry: () => {
                    void mutate()
                },
            }}
            isEmpty={leaders.length === 0}
            emptyContent={{ title: t("rail.leaderboardEmpty") }}
        >
            <div className="flex flex-col gap-1">
                {leaders.map((entry) => {
                    const isMe = entry.id === myUserId
                    return (
                        <div
                            key={entry.id}
                            className={cn(
                                "flex items-center gap-2 rounded-xl p-1",
                                isMe && "bg-accent/10",
                            )}
                        >
                            <Typography
                                type="body-xs"
                                weight="bold"
                                className={cn(
                                    "w-4 shrink-0 text-center tabular-nums",
                                    isMe ? "text-accent" : "text-muted",
                                )}
                            >
                                {entry.rank}
                            </Typography>
                            <InitialsAvatar
                                initials={entry.avatarInitials}
                                className="size-8 text-xs"
                            />
                            <Typography
                                type="body-xs"
                                weight="medium"
                                truncate
                                className="min-w-0 flex-1"
                            >
                                {entry.name}
                            </Typography>
                            <Typography
                                type="body-xs"
                                color="muted"
                                className="shrink-0 tabular-nums"
                            >
                                {t("rail.xp", { xp: formatXpShort(entry.xp) })}
                            </Typography>
                        </div>
                    )
                })}
            </div>
        </AsyncContent>
    )
}

/** Một dòng sự kiện trên rail: icon theo loại · tiêu đề · nhãn ngày giờ · chip hình thức. */
const UpcomingEventRow = ({ event }: { event: UpcomingEvent }) => {
    const t = useTranslations("eventSystem")
    const TypeIcon = TYPE_ICON[event.type] ?? CalendarIcon
    // Hôm nay/ngày mai thì chỉ cần giờ; xa hơn mới cần cả thứ + ngày.
    const dateLabel = event.dayKey
        ? `${t(`dayLabels.${event.dayKey}`)} · ${event.timeLabel}`
        : event.dateLabel

    return (
        <Link
            href={`/events/${event.id}`}
            className="flex items-center gap-2 rounded-xl p-1 no-underline transition-colors hover:bg-default/40"
        >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <TypeIcon aria-hidden focusable="false" className="size-4" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
                <Typography type="body-xs" weight="medium" truncate>
                    {event.title}
                </Typography>
                <Typography type="body-xs" color="muted" truncate>
                    {dateLabel}
                </Typography>
            </div>
            {event.locationType ? (
                <Chip size="sm" variant="soft" color="accent" className="shrink-0">
                    {t(`locationTypes.${event.locationType}`)}
                </Chip>
            ) : null}
        </Link>
    )
}

/** Skeleton khớp 3 dòng {@link UpcomingEventRow} — cùng ô icon, cùng 2 dòng chữ. */
const UpcomingEventsSkeleton = () => (
    <div className="flex flex-col gap-2">
        {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-2 p-1">
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Skeleton.Typography type="body-xs" width="2/3" />
                    <Skeleton.Typography type="body-xs" width="1/2" />
                </div>
            </div>
        ))}
    </div>
)

/** Ba sự kiện gần nhất — dữ liệu THẬT từ `GET /api/v1/events` qua `useQueryUpcomingEventsSwr`. */
const UpcomingEvents = () => {
    const t = useTranslations("eventSystem")
    const { events, isLoading, error, mutate } = useQueryUpcomingEventsSwr()

    return (
        <AsyncContent
            isLoading={isLoading && events.length === 0}
            skeleton={<UpcomingEventsSkeleton />}
            error={events.length === 0 ? error : undefined}
            errorContent={{
                title: t("catalog.loadError"),
                retryLabel: t("catalog.retry"),
                onRetry: () => {
                    void mutate()
                },
            }}
            isEmpty={events.length === 0}
            emptyContent={{ title: t("upcoming.empty") }}
        >
            <div className="flex flex-col gap-2">
                {events.map((event) => (
                    <UpcomingEventRow key={event.id} event={event} />
                ))}
            </div>
        </AsyncContent>
    )
}

/**
 * Right community rail (`xl`+): the global leaderboard's top five, the three nearest
 * upcoming events, then the live chat. Both lists are REAL
 * (`useQueryLeaderboardSwr` + `useQueryUpcomingEventsSwr`); pure composition otherwise.
 */
export const DiscoveryRail = () => {
    const t = useTranslations("communityHub")

    return (
        <div className="flex flex-col gap-3">
            <RailPanel
                title={t("rail.leaderboard")}
                seeAllHref="/leaderboard"
                seeAllLabel={t("rail.seeAll")}
            >
                <TopLeaders />
            </RailPanel>
            <RailPanel
                title={t("rail.events")}
                seeAllHref="/events"
                seeAllLabel={t("rail.seeAll")}
            >
                <UpcomingEvents />
            </RailPanel>
            <CommunityLiveChatRail />
        </div>
    )
}
