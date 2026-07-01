"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQueryGroupThreadsSwr } from "../hooks/useQueryGroupThreadsSwr"

/**
 * Group discussion (§7). DEFAULT on-canon layout: a list of discussion threads
 * (title + author + reply count). ponytail: rows hand-rolled; mock data.
 */
export const GroupDiscussion = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { threads } = useQueryGroupThreadsSwr(groupId)

    return (
        <div className="flex flex-col gap-3">
            {threads.map((thread) => (
                <div
                    key={thread.id}
                    className="flex items-center gap-3 rounded-large border border-separator p-4"
                >
                    <div className="min-w-0 flex-1">
                        <Typography type="body-sm" weight="medium" truncate>
                            {thread.title}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {thread.author}
                        </Typography>
                    </div>
                    <Chip size="sm" variant="soft" color="accent">
                        {t("discussion.replies", { count: thread.replies })}
                    </Chip>
                </div>
            ))}
        </div>
    )
}
