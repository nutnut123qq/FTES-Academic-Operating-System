"use client"

import React, { useState } from "react"
import { Typography, cn } from "@heroui/react"
import { CaretRightIcon, HeartIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useQueryTrendingSwr } from "../hooks/useQueryTrendingSwr"
import { useQueryContributorsSwr } from "../hooks/useQueryContributorsSwr"
import { useQueryPollSwr } from "../hooks/useQueryPollSwr"

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

/** Compact in-place poll — same local-vote reveal behavior as the poll page. */
const QuickPoll = () => {
    const { poll } = useQueryPollSwr()
    const [votedId, setVotedId] = useState<string | null>(null)

    if (!poll) {
        return null
    }

    const extra = votedId ? 1 : 0
    const total = poll.options.reduce((sum, option) => sum + option.votes, 0) + extra
    const percentOf = (option: { id: string; votes: number }) => {
        const votes = option.votes + (votedId === option.id ? 1 : 0)
        return total === 0 ? 0 : Math.round((votes / total) * 100)
    }
    const revealed = votedId !== null

    return (
        <div className="flex flex-col gap-2">
            <Typography type="body-sm">{poll.question}</Typography>
            {poll.options.map((option) => (
                <button
                    key={option.id}
                    type="button"
                    onClick={() => !revealed && setVotedId(option.id)}
                    className={cn(
                        "relative overflow-hidden rounded-large border p-2 text-left transition-colors",
                        votedId === option.id ? "border-accent" : "border-separator",
                        !revealed && "hover:bg-default/40",
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
        </div>
    )
}

/**
 * Right community rail (`xl`+): surfaces the buried community features next to
 * the feed — top trending posts, top contributors, and the community poll with
 * in-place voting — reusing the EXISTING mock hooks (no new data). Each panel
 * links to its full page. ponytail: pure composition; top-N slices.
 */
export const DiscoveryRail = () => {
    const t = useTranslations("communityHub")
    const { trending } = useQueryTrendingSwr()
    const { contributors } = useQueryContributorsSwr()

    return (
        <div className="flex flex-col gap-3">
            <RailPanel
                title={t("rail.trending")}
                seeAllHref="/community/trending"
                seeAllLabel={t("rail.seeAll")}
            >
                <div className="flex flex-col">
                    {trending.slice(0, 4).map((post, index) => (
                        <Link
                            key={post.id}
                            href={`/community/${post.id}`}
                            className="flex items-center gap-2 rounded-large px-2 py-2 no-underline transition-colors hover:bg-default/40"
                        >
                            <Typography type="body-xs" color="muted" className="shrink-0">
                                {index + 1}
                            </Typography>
                            <Typography type="body-xs" className="min-w-0 flex-1 truncate">
                                {post.title}
                            </Typography>
                            <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted">
                                <HeartIcon aria-hidden focusable="false" className="size-3.5" />
                                {post.likes}
                            </span>
                        </Link>
                    ))}
                </div>
            </RailPanel>

            <RailPanel
                title={t("rail.reputation")}
                seeAllHref="/community/reputation"
                seeAllLabel={t("rail.seeAll")}
            >
                <div className="flex flex-col">
                    {contributors.slice(0, 3).map((contributor, index) => (
                        <div key={contributor.id} className="flex items-center gap-2 px-2 py-2">
                            <Typography type="body-xs" color="muted" className="shrink-0">
                                {index + 1}
                            </Typography>
                            <Typography type="body-xs" className="min-w-0 flex-1 truncate">
                                {contributor.name}
                            </Typography>
                            <Typography type="body-xs" color="muted" className="shrink-0">
                                {t("reputation.score", {
                                    score: contributor.upvotes - contributor.downvotes,
                                })}
                            </Typography>
                        </div>
                    ))}
                </div>
            </RailPanel>

            <RailPanel
                title={t("rail.poll")}
                seeAllHref="/community/poll"
                seeAllLabel={t("rail.seeAll")}
            >
                <QuickPoll />
            </RailPanel>
        </div>
    )
}
