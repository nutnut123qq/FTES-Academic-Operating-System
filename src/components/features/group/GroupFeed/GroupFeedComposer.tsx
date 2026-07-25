"use client"

import React, { useCallback, useState } from "react"
import { Button, toast } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import { RestError } from "@/modules/api/rest/client"
import { createPost } from "@/modules/api/rest/community"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { matchesGroupFeedKey } from "../hooks/useQueryGroupFeedSwr"

/** Props for {@link GroupFeedComposer}. */
interface GroupFeedComposerProps {
    /** The group the post is published into. */
    groupId: string
}

/**
 * Composer for posting into a group's feed (§7).
 *
 * A group post is a community post scoped to the group, so this POSTs
 * `/community/posts` with `groupId` — the same write the community composer uses,
 * kept deliberately minimal here (title + body, no repost/quote/poll) because the
 * group feed card only renders the title + counters. The BE rejects a non-member
 * with 403 (`PostService` checks `groupMembership.isMember`), which is surfaced as a
 * "join first" message rather than a generic failure.
 *
 * On success it revalidates every locale variant of the group feed cache
 * ({@link matchesGroupFeedKey}) so the new post shows without a reload.
 */
export const GroupFeedComposer = ({ groupId }: GroupFeedComposerProps) => {
    const t = useTranslations("groupsHub")
    const { mutate } = useSWRConfig()
    const { requireAuth } = useRequireAuth()
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const canSubmit = title.trim() !== "" && body.trim() !== "" && !isSubmitting

    const onSubmit = useCallback(async () => {
        if (!canSubmit) {
            return
        }
        if (!requireAuth("auth.context.generic")) {
            return
        }
        setIsSubmitting(true)
        try {
            await createPost({
                postType: "DISCUSSION",
                title: title.trim(),
                content: body.trim(),
                groupId,
            })
            setTitle("")
            setBody("")
            toast.success(t("feed.composer.created"))
            // The write is the sole success signal — a failed feed refetch afterwards
            // must not be reported as a failed post.
            void mutate(matchesGroupFeedKey(groupId))
        } catch (error) {
            const status = error instanceof RestError ? error.status : 0
            if (status === 403) {
                toast.danger(t("feed.composer.forbidden"))
            } else if (status === 429) {
                toast.danger(t("feed.composer.rateLimited"))
            } else {
                toast.danger(t("feed.composer.failed"))
            }
        } finally {
            setIsSubmitting(false)
        }
    }, [body, canSubmit, groupId, mutate, requireAuth, t, title])

    return (
        <div className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
            <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("feed.composer.titleField")}
                disabled={isSubmitting}
                className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-60"
            />
            <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={t("feed.composer.bodyField")}
                rows={3}
                disabled={isSubmitting}
                className="w-full resize-none rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-60"
            />
            <Button
                size="sm"
                variant="secondary"
                className="self-start"
                isDisabled={!canSubmit}
                isPending={isSubmitting}
                onPress={() => void onSubmit()}
            >
                {t("feed.composer.submit")}
            </Button>
        </div>
    )
}
