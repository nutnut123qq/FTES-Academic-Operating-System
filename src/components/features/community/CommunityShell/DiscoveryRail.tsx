"use client"

import React, { useState } from "react"
import { Chip, Typography, cn, toast } from "@heroui/react"
import { CalendarIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { CommunityLiveChatRail } from "@/components/features/community/CommunityLiveChat"
import { TYPE_ICON } from "@/components/features/event/typeIcons"
import { useQueryPollSwr } from "../hooks/useQueryPollSwr"
import { useMutatePollVoteSwr } from "../hooks/useMutatePollVoteSwr"
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

/** Compact in-place poll — REAL read + vote, mirroring `CommunityPoll` (server truth wins). */
const QuickPoll = () => {
    const t = useTranslations("communityHub")
    const { poll } = useQueryPollSwr()
    const submitVote = useMutatePollVoteSwr()
    const [localVotedId, setLocalVotedId] = useState<string | null>(null)

    if (!poll) {
        return null
    }

    // Server truth wins once revalidate lands; local id only covers the optimistic window.
    const votedId = poll.myOptionId ?? localVotedId
    const pending = localVotedId !== null && !poll.myOptionId
    // Hết hạn thì BE từ chối mọi vote (`COMMUNITY_POLL_CLOSED`) — khoá click, chỉ hiện kết quả.
    const isClosed = poll.closesAt != null && new Date(poll.closesAt).getTime() <= Date.now()

    const onVote = (optionId: string) => {
        if (votedId !== null || isClosed) {
            return
        }
        setLocalVotedId(optionId)
        submitVote(poll.postId, optionId)
            .then((ok) => {
                if (!ok) {
                    setLocalVotedId(null)
                }
            })
            .catch(() => {
                setLocalVotedId(null)
                toast.danger(t("poll.voteFailed"))
            })
    }

    const extra = pending ? 1 : 0
    const total = poll.options.reduce((sum, option) => sum + option.votes, 0) + extra
    const percentOf = (option: { id: string; votes: number }) => {
        const votes = option.votes + (pending && localVotedId === option.id ? 1 : 0)
        return total === 0 ? 0 : Math.round((votes / total) * 100)
    }
    const revealed = votedId !== null || isClosed

    return (
        <div className="flex flex-col gap-2">
            <Typography type="body-sm">{poll.question}</Typography>
            {poll.options.map((option) => (
                <button
                    key={option.id}
                    type="button"
                    disabled={isClosed}
                    onClick={() => onVote(option.id)}
                    className={cn(
                        "relative overflow-hidden rounded-large border p-2 text-left transition-colors",
                        votedId === option.id ? "border-accent" : "border-separator",
                        !revealed && "hover:bg-default/40",
                        isClosed && "cursor-default",
                    )}
                >
                    {revealed ? (
                        <div
                            className="absolute inset-y-0 left-0 bg-accent/10"
                            style={{ width: `${percentOf(option)}%` }}
                        />
                    ) : null}
                    <div className="relative flex items-center justify-between gap-2">
                        <Typography type="body-xs" weight="medium">
                            {option.label}
                        </Typography>
                        {revealed ? (
                            <Typography type="body-xs" color="muted">
                                {percentOf(option)}%
                            </Typography>
                        ) : null}
                    </div>
                </button>
            ))}
            {isClosed ? (
                <Typography type="body-xs" color="muted">
                    {t("poll.closed")}
                </Typography>
            ) : null}
        </div>
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
            className="flex items-center gap-2 rounded-large p-1 no-underline transition-colors hover:bg-default/40"
        >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
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
                <Skeleton className="size-8 shrink-0 rounded-large" />
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
 * Right community rail (`xl`+): the community poll with in-place voting, the three
 * nearest upcoming events, then the live chat. Poll votes and the event list are REAL
 * (`useQueryPollSwr` + `useMutatePollVoteSwr` + `useQueryUpcomingEventsSwr`); pure
 * composition otherwise.
 */
export const DiscoveryRail = () => {
    const t = useTranslations("communityHub")

    return (
        <div className="flex flex-col gap-3">
            <RailPanel
                title={t("rail.poll")}
                seeAllHref="/community/poll"
                seeAllLabel={t("rail.seeAll")}
            >
                <QuickPoll />
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
