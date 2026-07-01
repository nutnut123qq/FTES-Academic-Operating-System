"use client"

import React from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQueryResourceDetailSwr } from "../hooks/useQueryResourceDetailSwr"

/**
 * Resource detail (§5). DEFAULT on-canon layout: a preview placeholder + meta +
 * rating + download + a comments list. ponytail: preview is a placeholder box;
 * mock data; download/comment are no-ops.
 */
export const ResourceDetail = () => {
    const t = useTranslations("resourceHub")
    const { resourceId } = useParams<{ resourceId: string }>()
    const { resource } = useQueryResourceDetailSwr(resourceId)

    if (!resource) {
        return null
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {resource.title}
            </Typography>

            {/* meta + actions */}
            <div className="flex flex-wrap items-center gap-2">
                <Chip size="sm" variant="soft" color="accent">
                    {resource.subject}
                </Chip>
                <Typography type="body-xs" color="muted">
                    {resource.sizeLabel} · {t("detail.rating", { rating: resource.rating.toFixed(1) })}
                </Typography>
                <Button size="sm" variant="secondary" className="ml-auto">
                    {t("download")}
                </Button>
            </div>

            {/* preview placeholder */}
            <div className="flex h-48 w-full items-center justify-center rounded-large bg-default/40">
                <Typography type="body-sm" color="muted">
                    {t("detail.preview")}
                </Typography>
            </div>

            {/* comments */}
            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("detail.comments")}
                </Typography>
                {resource.comments.map((comment) => (
                    <div
                        key={comment.id}
                        className="flex items-start gap-3 rounded-large border border-separator p-4"
                    >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                            {comment.author.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <Typography type="body-sm" weight="medium">
                                {comment.author}
                            </Typography>
                            <Typography type="body-sm" color="muted">
                                {comment.text}
                            </Typography>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
