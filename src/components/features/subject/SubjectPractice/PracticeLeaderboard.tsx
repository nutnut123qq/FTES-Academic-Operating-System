"use client"

import React from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { ArrowLeftIcon, CrownIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import {
    LEADERBOARD_CATEGORY_COLOR,
    useQuerySubjectLeaderboardSwr,
    type SubjectLeaderboardEntry,
} from "../hooks/useQuerySubjectLeaderboardSwr"

/** Props for {@link PracticeLeaderboard}. */
export interface PracticeLeaderboardProps {
    subjectId: string
    /** Return to the practice hub. */
    onBack: () => void
}

/** Visual podium order (left → right): 2nd, 1st (center, tallest), 3rd. */
const PODIUM_ORDER = [2, 1, 3] as const
/** Pedestal height per rank. */
const PEDESTAL_HEIGHT: Record<number, string> = { 1: "h-20", 2: "h-14", 3: "h-10" }

/** A thin stacked bar showing how an entry's total XP splits across categories. */
const XpSegmentBar = ({ entry }: { entry: SubjectLeaderboardEntry }) => {
    const sum = entry.challengeXp + entry.readingXp + entry.milestoneXp
    if (sum <= 0) {
        return <div className="h-1.5 w-4/5 rounded-full bg-default" />
    }
    const segment = (value: number, color: string) =>
        value > 0 ? (
            <span style={{ width: `${(value / sum) * 100}%`, backgroundColor: color }} />
        ) : null
    return (
        <div className="flex h-1.5 w-4/5 overflow-hidden rounded-full" aria-hidden>
            {segment(entry.challengeXp, LEADERBOARD_CATEGORY_COLOR.challenge)}
            {segment(entry.readingXp, LEADERBOARD_CATEGORY_COLOR.reading)}
            {segment(entry.milestoneXp, LEADERBOARD_CATEGORY_COLOR.milestone)}
        </div>
    )
}

/**
 * Practice leaderboard — a compact in-panel port of StarCI's `features/learn/
 * Leaderboard` (STT 9). Ranks the subject's learners by total XP: a top-3 podium
 * (leader centered + crowned on the tallest pedestal) over a ranked list where
 * each row carries an avatar, name, a stacked XP-composition bar (challenge ·
 * reading · milestone) and the XP value — the viewer's own podium/row is accented
 * with a "Bạn" chip. Mock data via `useQuerySubjectLeaderboardSwr`.
 */
export const PracticeLeaderboard = ({ subjectId, onBack }: PracticeLeaderboardProps) => {
    const t = useTranslations("subjects")
    const { entries, isLoading, error, mutate } = useQuerySubjectLeaderboardSwr(subjectId)

    // board shape: ≥3 → podium + list; otherwise plain list (mirrors StarCI)
    const showPodium = entries.length >= 3
    const podiumRows = showPodium ? entries.slice(0, 3) : []
    const listRows = showPodium ? entries.slice(3) : entries
    const byRank = new Map(podiumRows.map((entry, index) => [index + 1, entry]))

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="tertiary"
                    isIconOnly
                    aria-label={t("practice.backToHub")}
                    onPress={onBack}
                >
                    <ArrowLeftIcon className="size-5" aria-hidden focusable="false" />
                </Button>
                <div className="flex-1">
                    <Typography type="h5" weight="bold">
                        {t("practice.leaderboard.title")}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t("practice.leaderboard.subtitle")}
                    </Typography>
                </div>
            </div>

            <AsyncContent
                isLoading={isLoading && entries.length === 0}
                skeleton={
                    <div className="flex flex-col gap-2">
                        {[0, 1, 2, 3, 4].map((index) => (
                            <div key={index} className="flex items-center gap-3 px-2 py-2">
                                <Skeleton className="size-5 rounded-md" />
                                <Skeleton className="size-9 rounded-full" />
                                <div className="flex flex-1 flex-col gap-2">
                                    <Skeleton className="h-3 w-1/3 rounded-md" />
                                    <Skeleton className="h-1.5 w-4/5 rounded-full" />
                                </div>
                                <Skeleton className="h-3 w-10 rounded-md" />
                            </div>
                        ))}
                    </div>
                }
                isEmpty={entries.length === 0}
                emptyContent={{ title: t("practice.leaderboard.empty") }}
                error={error}
                errorContent={{
                    title: t("practice.leaderboard.error"),
                    onRetry: () => {
                        void mutate()
                    },
                }}
            >
                <div className="flex flex-col gap-6">
                    {/* top-3 podium */}
                    {showPodium ? (
                        <div className="flex items-end justify-center gap-3 sm:gap-4">
                            {PODIUM_ORDER.map((rank) => {
                                const entry = byRank.get(rank)
                                if (!entry) return null
                                const isLeader = rank === 1
                                return (
                                    <div key={rank} className="flex w-24 flex-col items-center gap-1.5">
                                        <div className="relative">
                                            {isLeader ? (
                                                <CrownIcon
                                                    aria-hidden
                                                    focusable="false"
                                                    className="absolute -top-4 left-1/2 size-5 -translate-x-1/2 text-warning"
                                                />
                                            ) : null}
                                            <UserAvatar
                                                username={entry.username}
                                                avatar={entry.avatar}
                                                size={isLeader ? "lg" : "md"}
                                                className={cn(entry.isViewer && "ring-2 ring-accent")}
                                            />
                                        </div>
                                        <Typography
                                            type="body-sm"
                                            weight={entry.isViewer ? "semibold" : "medium"}
                                            className="line-clamp-1 text-center"
                                        >
                                            {entry.isViewer ? t("practice.leaderboard.you") : entry.username}
                                        </Typography>
                                        <Typography
                                            type="body-xs"
                                            className={cn("shrink-0", entry.isViewer ? "text-accent" : "text-muted")}
                                        >
                                            {t("practice.leaderboard.xp", { xp: entry.totalXp })}
                                        </Typography>
                                        <div
                                            className={cn(
                                                "flex w-full items-center justify-center rounded-t-xl bg-default text-sm font-medium text-muted",
                                                PEDESTAL_HEIGHT[rank],
                                            )}
                                        >
                                            {rank}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : null}

                    {/* ranked list */}
                    <div className="flex flex-col gap-0.5">
                        {listRows.map((entry, index) => {
                            const displayRank = showPodium ? index + 4 : index + 1
                            return (
                                <div
                                    key={entry.id}
                                    className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-default/60"
                                >
                                    <div className="flex w-5 shrink-0 justify-center">
                                        {displayRank === 1 ? (
                                            <CrownIcon aria-hidden focusable="false" className="size-5 text-warning" />
                                        ) : (
                                            <Typography type="body-sm" weight="semibold" color="muted">
                                                {displayRank}
                                            </Typography>
                                        )}
                                    </div>
                                    <UserAvatar
                                        username={entry.username}
                                        avatar={entry.avatar}
                                        size="sm"
                                        className={cn(entry.isViewer && "ring-2 ring-accent")}
                                    />
                                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Typography type="body-sm" weight="medium" className="line-clamp-1">
                                                {entry.username}
                                            </Typography>
                                            {entry.isViewer ? (
                                                <Chip size="sm" variant="soft" color="accent">
                                                    {t("practice.leaderboard.you")}
                                                </Chip>
                                            ) : null}
                                        </div>
                                        <XpSegmentBar entry={entry} />
                                    </div>
                                    <Typography
                                        type="body-sm"
                                        weight="semibold"
                                        className={cn("shrink-0", entry.isViewer ? "text-accent" : "text-foreground")}
                                    >
                                        {t("practice.leaderboard.xp", { xp: entry.totalXp })}
                                    </Typography>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </AsyncContent>
        </div>
    )
}
