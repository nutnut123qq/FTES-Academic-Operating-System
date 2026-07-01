"use client"

import React, { useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import {
    useQuerySubjectFeedSwr,
    type FeedScope,
} from "../hooks/useQuerySubjectFeedSwr"

/** Feed scope tabs. */
const SCOPES: Array<FeedScope> = ["forYou", "following", "trending"]

/**
 * Community tab (§3 → §6). DEFAULT on-canon layout (no dedicated brainstorm):
 * a scope filter (For you / Following / Trending) + a dense list of post rows.
 * ponytail: rows hand-rolled (dense list = rows), initials avatar (icon-free);
 * mock feed until the BE community query exists.
 */
export const SubjectCommunity = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    const [scope, setScope] = useState<FeedScope>("forYou")
    const { posts } = useQuerySubjectFeedSwr(subjectId, scope)

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-3">
                <Typography type="h5" weight="bold">
                    {t("community.title")}
                </Typography>
                <div className="flex flex-wrap gap-2">
                    {SCOPES.map((item) => (
                        <Button
                            key={item}
                            size="sm"
                            variant={scope === item ? "secondary" : "ghost"}
                            onPress={() => setScope(item)}
                        >
                            {t(`community.scopes.${item}`)}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="flex flex-col gap-2 rounded-large border border-separator p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                                {post.author.slice(0, 1).toUpperCase()}
                            </div>
                            <Typography type="body-sm" weight="medium">
                                {post.author}
                            </Typography>
                            <Typography type="body-xs" color="muted">
                                {post.timeLabel}
                            </Typography>
                            <Chip size="sm" variant="soft" color="accent" className="ml-auto">
                                {t("community.reactions", { count: post.reactions })}
                            </Chip>
                        </div>
                        <Typography type="body" weight="medium">
                            {post.title}
                        </Typography>
                        <Typography type="body-sm" color="muted">
                            {post.snippet}
                        </Typography>
                    </div>
                ))}
            </div>
        </div>
    )
}
