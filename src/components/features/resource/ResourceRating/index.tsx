"use client"

import React, { useState } from "react"
import { Button, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQueryReviewsSwr, type Review } from "../hooks/useQueryReviewsSwr"

/** Renders a star row (filled ★ up to `value`, out of 5). */
const Stars = ({ value }: { value: number }) => (
    <span className="text-accent" aria-label={`${value}/5`}>
        {[1, 2, 3, 4, 5].map((star) => (
            <span key={star}>{star <= value ? "★" : "☆"}</span>
        ))}
    </span>
)

/**
 * Resource reviews (§5). DEFAULT on-canon layout: an interactive star rating + a
 * comment composer + a review list. ponytail: stars are text (icon-free);
 * new reviews are appended to local state only (no BE); mock initial data.
 */
export const ResourceRating = () => {
    const t = useTranslations("resourceHub")
    const { resourceId } = useParams<{ resourceId: string }>()
    const { reviews } = useQueryReviewsSwr(resourceId)
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
            <div className="flex flex-col gap-3 rounded-3xl border border-separator p-4">
                <div className="flex items-center gap-1 text-lg">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            aria-label={`${star}`}
                            onClick={() => setMyRating(star)}
                            className={cn(star <= myRating ? "text-accent" : "text-muted")}
                        >
                            {star <= myRating ? "★" : "☆"}
                        </button>
                    ))}
                </div>
                <input
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={t("reviews.placeholder")}
                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                />
                <Button size="sm" variant="secondary" className="self-start" onPress={submit} isDisabled={myRating === 0 || text.trim() === ""}>
                    {t("reviews.submit")}
                </Button>
            </div>

            {/* review list */}
            <div className="flex flex-col gap-3">
                {all.map((review) => (
                    <div key={review.id} className="flex flex-col gap-1 rounded-3xl border border-separator p-4">
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
        </div>
    )
}
