"use client"

import React from "react"
import { Button, Chip, Typography } from "@heroui/react"
import {
    CaretRightIcon,
    ChatCircleIcon,
    FileTextIcon,
    HeartIcon,
    PushPinIcon,
    TargetIcon,
    UsersIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Link, useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import {
    useQuerySubjectOverviewSwr,
    type OverviewChallenge,
    type OverviewPost,
    type SubjectOverview as SubjectOverviewModel,
} from "../hooks/useQuerySubjectOverviewSwr"

/** difficulty → chip color. */
const DIFFICULTY_COLOR: Record<OverviewChallenge["difficulty"], "success" | "warning" | "danger"> = {
    easy: "success",
    medium: "warning",
    hard: "danger",
}

/**
 * Subject-workspace Overview tab (§ subject hub) — direction A (chosen 2026-07-02):
 * a community hub, NOT a course sales page. A "you've joined" banner, then a two-
 * column layout: the discussion feed (pinned moderator post + recent posts) on the
 * left, and shortcut rails (new resources, highlighted challenges, active members)
 * on the right. The subject is a space you join like a community.
 *
 * Renders inside the existing `SubjectWorkspaceShell` (sidebar + identity header).
 * Feature owns data + routing + i18n. ponytail: "Đăng bài" + shortcut rows are
 * navigation/no-ops; feed rows are hand-rolled to match the sibling SubjectCommunity
 * idiom. Mock via `useQuerySubjectOverviewSwr`.
 */
export const SubjectOverview = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    const router = useRouter()
    const { overview, error, mutate } = useQuerySubjectOverviewSwr(subjectId)

    const base = `/subjects/${subjectId}`

    return (
        <div className="p-6">
            <AsyncContent
                isLoading={!overview && !error}
                skeleton={<OverviewSkeleton />}
                error={!overview ? error : undefined}
                errorContent={{
                    title: t("overview.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("overview.retry"),
                }}
            >
                {overview ? (
                    <OverviewView
                        overview={overview}
                        onCompose={() => router.push(`${base}/community`)}
                        base={base}
                    />
                ) : null}
            </AsyncContent>
        </div>
    )
}

/** Presentation of the loaded overview. */
const OverviewView = ({
    overview,
    onCompose,
    base,
}: {
    overview: SubjectOverviewModel
    onCompose: () => void
    base: string
}) => {
    const t = useTranslations("subjects")

    return (
        <div className="flex flex-col gap-6">
            {/* join banner */}
            <div className="flex flex-wrap items-center gap-3 rounded-large bg-accent/10 p-4">
                <UsersIcon aria-hidden focusable="false" className="size-6 shrink-0 text-accent" />
                <div className="min-w-0">
                    <Typography type="body-sm" weight="medium" className="text-accent">
                        {t("overview.joined")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("overview.statsLine", {
                            members: overview.stats.members,
                            moderators: overview.stats.moderators,
                            resources: overview.stats.resources,
                        })}
                    </Typography>
                </div>
                <Button variant="primary" className="ml-auto" onPress={onCompose}>
                    {t("overview.compose")}
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* feed */}
                <div className="flex flex-col gap-6 md:col-span-2">
                    {overview.pinnedPost ? (
                        <div className="flex flex-col gap-1 rounded-large border border-accent/40 bg-accent/5 p-4">
                            <div className="flex items-center gap-1 text-accent">
                                <PushPinIcon aria-hidden focusable="false" className="size-4" />
                                <Typography type="body-xs" weight="medium" className="text-accent">
                                    {t("overview.pinned")}
                                </Typography>
                            </div>
                            <Typography type="body" weight="medium">
                                {overview.pinnedPost.title}
                            </Typography>
                            <Typography type="body-sm" color="muted">
                                {overview.pinnedPost.snippet}
                            </Typography>
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-3">
                        <Typography type="h6" weight="bold">
                            {t("overview.discussions")}
                        </Typography>
                        {overview.posts.map((post, index) => (
                            <PostRow key={post.id} post={post} withDivider={index > 0} />
                        ))}
                    </div>
                </div>

                {/* shortcut rails */}
                <div className="flex flex-col gap-6">
                    <RailCard title={t("overview.newResources")} href={`${base}/resources`} seeAll={t("overview.seeAll")}>
                        {overview.newResources.map((resource) => (
                            <div key={resource.id} className="flex items-center gap-2">
                                <FileTextIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                                <Typography type="body-sm" color="muted" className="min-w-0 flex-1" truncate>
                                    {resource.title}
                                </Typography>
                                <Chip size="sm" variant="soft" color="accent">
                                    {t(`resources.types.${resource.type}`)}
                                </Chip>
                            </div>
                        ))}
                    </RailCard>

                    <RailCard title={t("overview.challenges")} href={`${base}/practice`} seeAll={t("overview.seeAll")}>
                        {overview.challenges.map((challenge) => (
                            <div key={challenge.id} className="flex items-center gap-2">
                                <TargetIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                                <Typography type="body-sm" color="muted" className="min-w-0 flex-1" truncate>
                                    {challenge.title}
                                </Typography>
                                <Chip size="sm" variant="soft" color={DIFFICULTY_COLOR[challenge.difficulty]}>
                                    {t(`overview.difficulty.${challenge.difficulty}`)}
                                </Chip>
                            </div>
                        ))}
                    </RailCard>

                    <RailCard title={t("overview.activeMembers")} href={`${base}/members`} seeAll={t("overview.seeAll")}>
                        <div className="flex items-center">
                            {overview.activeMembers.map((member, index) => (
                                <div
                                    key={member.id}
                                    className={index > 0 ? "-ml-2 flex size-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent ring-2 ring-background" : "flex size-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent ring-2 ring-background"}
                                >
                                    {member.name.slice(0, 1).toUpperCase()}
                                </div>
                            ))}
                            {overview.activeOverflow > 0 ? (
                                <div className="-ml-2 flex size-8 items-center justify-center rounded-full bg-default/40 text-xs text-muted ring-2 ring-background">
                                    +{overview.activeOverflow}
                                </div>
                            ) : null}
                        </div>
                    </RailCard>
                </div>
            </div>
        </div>
    )
}

/** A single discussion row: initials avatar + author/time + title + snippet + reactions. */
const PostRow = ({
    post,
    withDivider,
}: {
    post: OverviewPost
    withDivider: boolean
}) => (
    <div className={withDivider ? "flex gap-3 border-t border-separator pt-3" : "flex gap-3"}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
            {post.author.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex min-w-0 flex-col gap-0">
            <div className="flex items-center gap-2">
                <Typography type="body-sm" weight="medium">
                    {post.author}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {post.timeLabel}
                </Typography>
            </div>
            <Typography type="body-sm" weight="medium">
                {post.title}
            </Typography>
            <Typography type="body-sm" color="muted">
                {post.snippet}
            </Typography>
            <div className="mt-1 flex items-center gap-3 text-muted">
                <span className="flex items-center gap-1">
                    <HeartIcon aria-hidden focusable="false" className="size-4" />
                    <Typography type="body-xs" color="muted">{post.reactions}</Typography>
                </span>
                <span className="flex items-center gap-1">
                    <ChatCircleIcon aria-hidden focusable="false" className="size-4" />
                    <Typography type="body-xs" color="muted">{post.comments}</Typography>
                </span>
            </div>
        </div>
    </div>
)

/** A right-rail shortcut card: a title + "see all" link over a small list. */
const RailCard = ({
    title,
    href,
    seeAll,
    children,
}: {
    title: string
    href: string
    seeAll: string
    children: React.ReactNode
}) => (
    <div className="flex flex-col gap-3 rounded-large border border-separator p-4">
        <div className="flex items-center gap-2">
            <Typography type="body-sm" weight="medium" className="min-w-0 flex-1">
                {title}
            </Typography>
            <Link href={href} className="flex items-center gap-0.5 text-sm text-accent no-underline">
                {seeAll}
                <CaretRightIcon aria-hidden focusable="false" className="size-4" />
            </Link>
        </div>
        {children}
    </div>
)

/** Loading skeleton — mirrors the banner + two-column hub. */
const OverviewSkeleton = () => (
    <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full rounded-large" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-4 md:col-span-2">
                <Skeleton className="h-24 w-full rounded-large" />
                <Skeleton className="h-20 w-full rounded-large" />
            </div>
            <div className="flex flex-col gap-6">
                <Skeleton className="h-28 w-full rounded-large" />
                <Skeleton className="h-24 w-full rounded-large" />
            </div>
        </div>
    </div>
)
