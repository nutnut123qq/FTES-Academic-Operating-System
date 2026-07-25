"use client"

import React, { useState } from "react"
import { Button, Skeleton, TextArea, TextField, Typography, cn, toast } from "@heroui/react"
import { StarIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"

import { useAppSelector } from "@/redux/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import { REVIEW_STAR_BUCKETS, useQueryReviewsSwr } from "../hooks/useQueryReviewsSwr"
import { useMutateRateResourceSwr } from "../hooks/useMutateRateResourceSwr"

/** Page size for the review list. */
const REVIEWS_PAGE_SIZE = 10

/** A static (read-only) star row rendered from a 1–5 value. */
const StarRow = ({ value, className }: { value: number; className?: string }) => (
    <span className={cn("flex items-center gap-0.5", className)} aria-label={`${value}/5`}>
        {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon
                key={star}
                aria-hidden
                focusable="false"
                weight={star <= value ? "fill" : "regular"}
                className={cn("size-4", star <= value ? "text-accent" : "text-muted")}
            />
        ))}
    </span>
)

/** Interactive 1–5 star picker for the composer. */
const StarPicker = ({
    value,
    onChange,
    label,
    isDisabled,
}: {
    value: number
    onChange: (next: number) => void
    label: (star: number) => string
    isDisabled: boolean
}) => (
    <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                type="button"
                aria-label={label(star)}
                aria-pressed={star <= value}
                disabled={isDisabled}
                onClick={() => onChange(star)}
                className={cn(
                    "rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
                    isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                    star <= value ? "text-accent" : "text-muted hover:text-accent",
                )}
            >
                <StarIcon
                    aria-hidden
                    focusable="false"
                    weight={star <= value ? "fill" : "regular"}
                    className="size-6"
                />
            </button>
        ))}
    </div>
)

/** Loading skeleton — mirrors the aggregate block + a few review rows. */
const ReviewsSkeleton = () => (
    <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-48 rounded-large" />
        {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-start gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3 w-32 rounded-full" />
                    <Skeleton className="h-3 w-full rounded-full" />
                </div>
            </div>
        ))}
    </div>
)

/**
 * Resource reviews (§5) — BE-wired: the aggregate (average, rating count, 1–5 star
 * distribution) and the review rows all come from `GET /api/v1/resources/{id}/ratings`,
 * and the composer writes through `POST /api/v1/resources/{id}/ratings` before
 * revalidating the list. Nothing is appended to local state any more, so what the page
 * shows after a submit is what the server actually stored.
 *
 * Guests are gated into the auth modal before the write (`useRequireAuth`), and a rejected
 * write is classified into friendly copy (already rated / no access / rate limited)
 * instead of a raw error. The author label comes from `userId` — the rating DTO carries no
 * author card, so nothing is invented client-side.
 */
export const ResourceRating = () => {
    const t = useTranslations("resourceHub")
    const locale = useLocale()
    const { resourceId } = useParams<{ resourceId: string }>()
    const viewerId = useAppSelector((state) => state.user.user?.id)
    const { requireAuth } = useRequireAuth()

    const [page, setPage] = useState(1)
    const ratingsSwr = useQueryReviewsSwr(resourceId, { page, size: REVIEWS_PAGE_SIZE })
    const rate = useMutateRateResourceSwr()

    const [myRating, setMyRating] = useState(0)
    const [text, setText] = useState("")

    const { reviews, avg, count, distribution, total, error, mutate, isLoading, summary } = ratingsSwr
    const pageCount = Math.max(1, Math.ceil(total / REVIEWS_PAGE_SIZE))
    // Bars are scaled to the busiest bucket so a 3-rating resource still reads clearly.
    const maxBucket = Math.max(
        1,
        ...REVIEW_STAR_BUCKETS.map((star) => distribution[String(star)] ?? 0),
    )

    const submit = async () => {
        if (myRating === 0 || rate.isMutating) {
            return
        }
        // Guests: open the auth modal instead of firing a write that would 401.
        if (!requireAuth("auth.context.rate")) {
            return
        }

        const trimmed = text.trim()
        const outcome = await rate.submit(resourceId, {
            stars: myRating,
            review: trimmed === "" ? undefined : trimmed,
        })

        switch (outcome.status) {
            case "rated":
                toast.success(t("reviews.submitted"))
                setText("")
                setMyRating(0)
                setPage(1)
                void mutate()
                break
            case "conflict":
                // Already rated: server state wins — refetch so the viewer sees theirs.
                toast.warning(t("reviews.alreadyRated"))
                setPage(1)
                void mutate()
                break
            case "unauthorized":
                requireAuth("auth.context.rate")
                break
            case "forbidden":
                toast.danger(t("reviews.forbidden"))
                break
            case "notFound":
                toast.danger(t("reviews.notFound"))
                break
            case "rateLimited":
                toast.danger(t("reviews.rateLimited"))
                break
            default:
                toast.danger(t("reviews.submitError"))
                break
        }
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {t("reviews.title")}
            </Typography>

            {/* aggregate summary: average + count + star distribution */}
            <div className="flex flex-col gap-4 rounded-2xl border border-separator p-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex shrink-0 flex-col items-center gap-1">
                    <Typography type="h3" weight="bold">
                        {avg.toFixed(1)}
                    </Typography>
                    <StarRow value={Math.round(avg)} />
                    <Typography type="body-xs" color="muted">
                        {t("reviews.count", { count })}
                    </Typography>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {REVIEW_STAR_BUCKETS.map((star) => {
                        const bucket = distribution[String(star)] ?? 0
                        return (
                            <div key={star} className="flex items-center gap-2">
                                <Typography type="body-xs" color="muted" className="w-8 shrink-0">
                                    {t("reviews.starShort", { count: star })}
                                </Typography>
                                <div
                                    role="presentation"
                                    className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-default"
                                >
                                    <div
                                        className="h-full rounded-full bg-accent"
                                        style={{ width: `${(bucket / maxBucket) * 100}%` }}
                                    />
                                </div>
                                <Typography
                                    type="body-xs"
                                    color="muted"
                                    className="w-8 shrink-0 text-right"
                                >
                                    {bucket}
                                </Typography>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* composer */}
            <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
                <Typography type="body-sm" weight="medium">
                    {t("reviews.composerTitle")}
                </Typography>
                <StarPicker
                    value={myRating}
                    onChange={setMyRating}
                    isDisabled={rate.isMutating}
                    label={(star) => t("reviews.starLabel", { count: star })}
                />
                <TextField variant="secondary" className="w-full">
                    <TextArea
                        rows={3}
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        placeholder={t("reviews.placeholder")}
                        aria-label={t("reviews.placeholder")}
                        className="resize-none"
                    />
                </TextField>
                <Button
                    size="sm"
                    variant="primary"
                    className="self-start"
                    onPress={() => void submit()}
                    isPending={rate.isMutating}
                    isDisabled={myRating === 0 || rate.isMutating}
                >
                    {t("reviews.submit")}
                </Button>
            </div>

            {/* review list */}
            <AsyncContent
                isLoading={isLoading && !summary}
                skeleton={<ReviewsSkeleton />}
                isEmpty={reviews.length === 0}
                emptyContent={{ title: t("reviews.empty") }}
                error={!summary ? error : undefined}
                errorContent={{
                    title: t("reviews.loadError"),
                    onRetry: () => void mutate(),
                    retryLabel: t("hub.retry"),
                }}
            >
                <div className="flex flex-col gap-4">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="flex items-start gap-3 rounded-2xl border border-separator p-4"
                        >
                            <UserAvatar
                                username={review.userId}
                                seed={review.userId}
                                size="sm"
                                className="size-8 shrink-0"
                            />
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Typography type="body-sm" weight="medium">
                                        {review.userId === viewerId
                                            ? t("reviews.you")
                                            : t("reviews.member")}
                                    </Typography>
                                    <StarRow value={review.stars} />
                                    <Typography type="body-xs" color="muted">
                                        {formatRelativeTime(review.createdAt, locale)}
                                    </Typography>
                                </div>
                                {review.review ? (
                                    <Typography type="body-sm" color="muted">
                                        {review.review}
                                    </Typography>
                                ) : null}
                            </div>
                        </div>
                    ))}

                    {pageCount > 1 ? (
                        <div className="flex items-center justify-center gap-3">
                            <Button
                                size="sm"
                                variant="tertiary"
                                isDisabled={page <= 1 || ratingsSwr.isValidating}
                                onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                            >
                                {t("reviews.prev")}
                            </Button>
                            <Typography type="body-xs" color="muted">
                                {t("reviews.pageOf", { page, total: pageCount })}
                            </Typography>
                            <Button
                                size="sm"
                                variant="tertiary"
                                isDisabled={page >= pageCount || ratingsSwr.isValidating}
                                onPress={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                            >
                                {t("reviews.next")}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </AsyncContent>
        </div>
    )
}
