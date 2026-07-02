"use client"

import React from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQueryResourceDetailSwr } from "../hooks/useQueryResourceDetailSwr"
import { ResourceComments } from "./ResourceComments"

/**
 * Resource detail (§5). DEFAULT on-canon layout: a preview placeholder + meta +
 * rating + download + an interactive comments section (`ResourceComments`).
 * ponytail: preview is a placeholder box; mock data; download is a no-op.
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

            {/* comments (Threads-style discussion; rating lives on /reviews) */}
            <ResourceComments />
        </div>
    )
}
