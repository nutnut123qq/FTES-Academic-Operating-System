"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button, Skeleton, TextArea, TextField, Typography, cn, toast } from "@heroui/react"
import { StarIcon, TrashIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import { useGetCourseRatingsSwr } from "@/hooks/swr/api/rest/queries/useGetCourseRatingsSwr"
import { useGetMyCourseRatingSwr } from "@/hooks/swr/api/rest/queries/useGetMyCourseRatingSwr"
import { usePostRateCourseSwr } from "@/hooks/swr/api/rest/mutations/usePostRateCourseSwr"
import { useDeleteCourseRatingSwr } from "@/hooks/swr/api/rest/mutations/useDeleteCourseRatingSwr"
import { RestError } from "@/modules/api/rest/client"
import { useRestWithToast } from "@/modules/toast/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Page size for the reviews list. */
const RATINGS_PAGE_SIZE = 5

/** Props for {@link CourseRatings}. */
export interface CourseRatingsProps extends WithClassNames<undefined> {
    /** The course UUID (`course.rawId`), NOT the slug — the rating API keys on it. */
    courseId: string
    /**
     * Whether the viewer is enrolled in this course — the SAME signal the detail
     * page's enroll CTA reads (`useCourseEnrollment().isEnrolled`). Gates the
     * composer INPUT: a signed-in but NOT-enrolled viewer sees the form yet cannot
     * type a review or pick a star — clicking/focusing either surfaces the
     * "enroll first" prompt instead of accepting input. Enrolled → unchanged.
     */
    isEnrolled: boolean
}

/** A static (read-only) star row rendered from a 1–5 value. */
const StarRow = ({ value, className }: { value: number; className?: string }) => (
    <span className={cn("flex items-center gap-0.5 text-accent", className)} aria-label={`${value}/5`}>
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
    locked = false,
    onLockedInteract,
}: {
    value: number
    onChange: (next: number) => void
    label: (star: number) => string
    /**
     * When true the picker is gated for INPUT: clicking a star fires
     * {@link onLockedInteract} (the enroll-first prompt) instead of selecting a rating.
     */
    locked?: boolean
    /** Called when a `locked` picker is clicked, so the caller can prompt to enroll. */
    onLockedInteract?: () => void
}) => (
    <div className="flex items-center gap-2" aria-disabled={locked || undefined}>
        {[1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                type="button"
                aria-label={label(star)}
                aria-pressed={locked ? undefined : star <= value}
                aria-disabled={locked || undefined}
                onClick={() => (locked ? onLockedInteract?.() : onChange(star))}
                className={cn(
                    "rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
                    locked
                        ? "cursor-not-allowed text-muted"
                        : cn(
                              "cursor-pointer",
                              star <= value ? "text-accent" : "text-muted hover:text-accent",
                          ),
                )}
            >
                <StarIcon
                    aria-hidden
                    focusable="false"
                    weight={!locked && star <= value ? "fill" : "regular"}
                    className="size-6"
                />
            </button>
        ))}
    </div>
)

/** Loading skeleton — mirrors the aggregate line + two review rows. */
const RatingsSkeleton = () => (
    <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40 rounded-full" />
        {[0, 1].map((row) => (
            <div key={row} className="flex items-start gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-3 w-3/4 rounded-md" />
                </div>
            </div>
        ))}
    </div>
)

/**
 * Course rating section for the detail page — the real BE-wired replacement for
 * the mock reviews block. Shows the aggregate (avg star + count), a paged review
 * list, and (for an authenticated viewer) a star composer that upserts their own
 * rating with edit + delete, prefilled from `GET .../ratings/me`.
 *
 * A 403 `COURSE_ACCESS_DENIED` (viewer lacks FULL access) surfaces a friendly
 * toast rather than crashing. Mirrors the ResourceRating visual pattern.
 * @param props - {@link CourseRatingsProps}
 */
export const CourseRatings = ({ courseId, isEnrolled, className }: CourseRatingsProps) => {
    const t = useTranslations("courseSystem")
    const locale = useLocale()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useAppSelector((state) => state.user.user?.id)
    const runRest = useRestWithToast()

    // A signed-in viewer who has NOT enrolled may SEE the composer but cannot input:
    // clicking/focusing the stars or the textarea prompts them to enroll first rather
    // than accepting a rating or text. Reuses the enroll CTA's `isEnrolled` signal;
    // the server-side submit gate (403 → accessDenied toast) is left untouched.
    const canReview = isEnrolled
    const notifyEnrollFirst = useCallback(() => {
        toast.warning(t("detail.rating.enrollFirst"))
    }, [t])

    const [page, setPage] = useState(1)
    const ratingsSwr = useGetCourseRatingsSwr(courseId, { page, size: RATINGS_PAGE_SIZE })
    const mineSwr = useGetMyCourseRatingSwr(courseId, authenticated)
    const rate = usePostRateCourseSwr()
    const remove = useDeleteCourseRatingSwr()

    const summary = ratingsSwr.data
    const mine = mineSwr.data

    // Seed the composer from the viewer's existing rating once it resolves.
    const [stars, setStars] = useState(0)
    const [review, setReview] = useState("")
    useEffect(() => {
        if (mine) {
            setStars(mine.stars)
            setReview(mine.review ?? "")
        } else {
            setStars(0)
            setReview("")
        }
    }, [mine])

    const items = summary?.items ?? []
    const total = summary?.total ?? 0
    const pageCount = Math.max(1, Math.ceil(total / RATINGS_PAGE_SIZE))
    const isBusy = rate.isMutating || remove.isMutating

    const onSubmit = async () => {
        if (stars === 0 || isBusy) {
            return
        }
        const trimmed = review.trim()
        const ok = await runRest(
            async () => {
                try {
                    return await rate.trigger({
                        courseId,
                        request: { stars, review: trimmed === "" ? undefined : trimmed },
                    })
                } catch (error) {
                    // Surface the "must enroll" case as friendly copy; re-throw so
                    // the toast wrapper renders it as the error description.
                    //
                    // Read the code off `RestError.errorCode`, NOT off `.message`: the message
                    // is the backend text alone (it no longer has the code glued onto it), so a
                    // `message.includes("COURSE_ACCESS_DENIED")` sniff matches nothing and the
                    // not-enrolled rater would get the raw backend string instead of this copy.
                    if (error instanceof RestError && error.errorCode === "COURSE_ACCESS_DENIED") {
                        throw new Error(t("detail.rating.accessDenied"))
                    }
                    throw error
                }
            },
            { successMessage: t("detail.rating.submitted") },
        )
        if (ok) {
            setPage(1)
            void ratingsSwr.mutate()
            void mineSwr.mutate()
        }
    }

    const onDelete = async () => {
        if (isBusy) {
            return
        }
        const ok = await runRest(() => remove.trigger(courseId), {
            successMessage: t("detail.rating.deleted"),
        })
        if (ok !== null) {
            setStars(0)
            setReview("")
            setPage(1)
            void ratingsSwr.mutate()
            void mineSwr.mutate()
        }
    }

    return (
        <section className={cn("flex flex-col gap-4 border-t border-separator pt-6", className)}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Typography type="h6" weight="bold">
                    {t("detail.reviews")}
                </Typography>
                {summary ? (
                    <div className="flex items-center gap-2">
                        <StarRow value={Math.round(summary.avgStar)} />
                        <Typography type="body-sm" color="muted">
                            {t("detail.rating.aggregate", {
                                avg: summary.avgStar.toFixed(1),
                                count: summary.ratingCount,
                            })}
                        </Typography>
                    </div>
                ) : null}
            </div>

            {/* composer — authenticated viewers only */}
            {authenticated ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
                    <Typography type="body-sm" weight="medium">
                        {t("detail.rating.composerTitle")}
                    </Typography>
                    <StarPicker
                        value={stars}
                        onChange={setStars}
                        label={(star) => t("detail.rating.starLabel", { count: star })}
                        locked={!canReview}
                        onLockedInteract={notifyEnrollFirst}
                    />
                    <TextField variant="secondary" className="w-full">
                        <TextArea
                            rows={3}
                            value={review}
                            onChange={(event) => setReview(event.target.value)}
                            placeholder={t("detail.rating.reviewPlaceholder")}
                            aria-label={t("detail.rating.reviewPlaceholder")}
                            // Not-enrolled: stay READ-ONLY (still focusable to catch the
                            // interaction) rather than `disabled`, so the enroll prompt is
                            // reachable. `onMouseDown` swallows the click-to-focus and
                            // prompts; `onFocus` bounces keyboard (Tab) focus back out.
                            readOnly={!canReview}
                            aria-disabled={!canReview || undefined}
                            onMouseDown={
                                canReview
                                    ? undefined
                                    : (event) => {
                                          event.preventDefault()
                                          notifyEnrollFirst()
                                      }
                            }
                            onFocus={
                                canReview
                                    ? undefined
                                    : (event) => {
                                          event.target.blur()
                                          notifyEnrollFirst()
                                      }
                            }
                            className={cn("resize-none", !canReview && "cursor-not-allowed")}
                        />
                    </TextField>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            size="sm"
                            variant="primary"
                            onPress={() => void onSubmit()}
                            isPending={rate.isMutating}
                            isDisabled={stars === 0 || isBusy}
                        >
                            {mine ? t("detail.rating.update") : t("detail.rating.submit")}
                        </Button>
                        {mine ? (
                            <Button
                                size="sm"
                                variant="tertiary"
                                onPress={() => void onDelete()}
                                isPending={remove.isMutating}
                                isDisabled={isBusy}
                            >
                                <TrashIcon aria-hidden focusable="false" className="size-4" />
                                {t("detail.rating.delete")}
                            </Button>
                        ) : null}
                    </div>
                </div>
            ) : (
                <Typography type="body-sm" color="muted">
                    {t("detail.rating.signInHint")}
                </Typography>
            )}

            {/* review list */}
            <AsyncContent
                isLoading={!ratingsSwr.data && !ratingsSwr.error}
                skeleton={<RatingsSkeleton />}
                isEmpty={items.length === 0}
                emptyContent={{ title: t("detail.rating.empty") }}
                error={!ratingsSwr.data ? ratingsSwr.error : undefined}
                errorContent={{
                    title: t("detail.rating.loadError"),
                    onRetry: () => { void ratingsSwr.mutate() },
                    retryLabel: t("detail.retry"),
                }}
            >
                <div className="flex flex-col gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-start gap-3">
                            <UserAvatar
                                username={item.author?.username ?? item.author?.displayName ?? item.userId}
                                avatar={item.author?.avatarUrl}
                                seed={item.userId}
                                size="sm"
                                className="size-8 shrink-0"
                            />
                            <div className="flex min-w-0 flex-1 flex-col gap-0">
                                <div className="flex items-center gap-2">
                                    <StarRow value={item.stars} />
                                    <Typography type="body-xs" color="muted">
                                        {formatRelativeTime(item.updatedAt ?? item.createdAt, locale)}
                                    </Typography>
                                    {item.userId === viewerId ? (
                                        <Typography type="body-xs" color="muted">
                                            · {t("detail.rating.you")}
                                        </Typography>
                                    ) : null}
                                </div>
                                {item.review ? (
                                    <Typography type="body-sm" color="muted">
                                        {item.review}
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
                                {t("detail.rating.prev")}
                            </Button>
                            <Typography type="body-xs" color="muted">
                                {t("detail.rating.pageOf", { page, total: pageCount })}
                            </Typography>
                            <Button
                                size="sm"
                                variant="tertiary"
                                isDisabled={page >= pageCount || ratingsSwr.isValidating}
                                onPress={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                            >
                                {t("detail.rating.next")}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </AsyncContent>
        </section>
    )
}
