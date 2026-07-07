"use client"

import React, { useState } from "react"
import { Button, Input, Skeleton, TextField, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useQueryReviewsSwr, type Review } from "../hooks/useQueryReviewsSwr"

/** Renders a star row (filled ★ up to `value`, out of 5). */
const Stars = ({ value }: { value: number }) => (
    <span className="text-accent" aria-label={`${value}/5`}>
        {[1, 2, 3, 4, 5].map((star) => (
            <span key={star}>{star <= value ? "★" : "☆"}</span>
        ))}
    </span>
)

/** Loading skeleton — mirrors a review row (name + star line + text). */
const ReviewsSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2].map((row) => (
            <div key={row} className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                <Skeleton className="h-4 w-40 rounded-full" />
                <Skeleton className="h-3 w-full rounded-full" />
            </div>
        ))}
    </div>
)

/**
 * Resource reviews (§5). DEFAULT on-canon layout: an interactive star rating + a
 * comment composer + a review list. ponytail: stars are text (icon-free);
 * new reviews are appended to local state only (no BE); mock initial data.
 */
export const ResourceRating = () => {
    const t = useTranslations("resourceHub")
    const { resourceId } = useParams<{ resourceId: string }>()
    const { reviews, isLoading, error, mutate } = useQueryReviewsSwr(resourceId)
    const [myRating, setMyRating] = useState(0)
    const [text, setText] = useState("")
    const [added, setAdded] = useState<Array<Review>>([])

    const submit = () => {
        if (myRating === 0 || text.trim() === "") {
            return
        }
        setAdded((prev) => [{ id: `local-${prev.length}`, author: t("reviews.you"), rating: myRating, text: text.trim() }, ...prev])
        setText("")
        setMyRating(0)
    }

    const all = [...added, ...reviews]

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {t("reviews.title")}
            </Typography>

            {/* composer */}
            <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
                <div className="flex items-center gap-2 text-lg">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            aria-label={`${star}`}
                            aria-pressed={star <= myRating}
                            onClick={() => setMyRating(star)}
                            className={cn(
                                "cursor-pointer rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
                                star <= myRating ? "text-accent" : "text-muted hover:text-accent",
                            )}
                        >
                            {star <= myRating ? "★" : "☆"}
                        </button>
                    ))}
                </div>
                <TextField variant="secondary" className="w-full">
                    <Input
                        variant="secondary"
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        placeholder={t("reviews.placeholder")}
                        aria-label={t("reviews.placeholder")}
                    />
                </TextField>
                <Button size="sm" variant="secondary" className="self-start" onPress={submit} isDisabled={myRating === 0 || text.trim() === ""}>
                    {t("reviews.submit")}
                </Button>
            </div>

            {/* review list */}
            <AsyncContent
                isLoading={isLoading && reviews.length === 0}
                skeleton={<ReviewsSkeleton />}
                isEmpty={all.length === 0}
                emptyContent={{ title: t("reviews.empty") }}
                error={reviews.length === 0 ? error : undefined}
                errorContent={{
                    title: t("reviews.loadError"),
                    onRetry: () => void mutate(),
                    retryLabel: t("hub.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {all.map((review) => (
                        <div key={review.id} className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                            <div className="flex items-center gap-2">
                                <Typography type="body-sm" weight="medium">
                                    {review.author}
                                </Typography>
                                <Stars value={review.rating} />
                            </div>
                            <Typography type="body-sm" color="muted">
                                {review.text}
                            </Typography>
                        </div>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
