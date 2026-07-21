"use client"

import { useCallback } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import { toast } from "@heroui/react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { createPost } from "@/modules/api/rest/community"
import type { MediaInput } from "@/modules/api/rest/community/types"
import { subjectFeedKey, type FeedScope } from "./useQuerySubjectFeedSwr"

/** A discussion draft submitted from the subject workspace composer. */
export interface SubmitSubjectPostInput {
    title: string
    content: string
    /** Already-uploaded images (the picker uploads on pick). */
    media?: Array<MediaInput>
}

/**
 * Publishes a subject discussion post. The tab READS through GraphQL
 * (`subjectWorkspace.community`) but the gateway is read-only, so the write goes through the
 * community REST API with the post anchored to the subject — a discussion post IS a community
 * post carrying `subjectId`.
 *
 * `subjectId` must be the subject's UUID: the route segment is the course code, which the
 * GraphQL feed does not accept. The caller passes the resolved uuid and keeps the composer
 * disabled until it exists.
 *
 * On success the subject feed cache is revalidated so the new post appears without a reload;
 * a revalidation error must NOT be reported as a failed publish.
 *
 * @returns `submit(input)` resolving `true` on success, `false` on failure or a blocked guest —
 * `false` tells the composer to keep the draft.
 */
export const useMutateCreateSubjectPostSwr = (subjectId: string, scope: FeedScope) => {
    const t = useTranslations("subjects")
    const locale = useLocale()
    const { mutate } = useSWRConfig()
    const { requireAuth } = useRequireAuth()

    return useCallback(
        async (input: SubmitSubjectPostInput): Promise<boolean> => {
            if (!subjectId) {
                return false
            }
            if (!requireAuth("auth.context.generic")) {
                return false
            }
            try {
                await createPost({
                    postType: "DISCUSSION",
                    title: input.title,
                    content: input.content,
                    subjectId,
                    media: input.media && input.media.length > 0 ? input.media : undefined,
                })
            } catch {
                toast.danger(t("community.createFailed"))
                return false
            }
            await mutate(subjectFeedKey(subjectId, locale, scope)).catch(() => {})
            return true
        },
        [subjectId, scope, locale, mutate, requireAuth, t],
    )
}
