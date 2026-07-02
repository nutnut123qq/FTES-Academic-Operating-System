"use client"

import { useCallback } from "react"
import useSWRMutation from "swr/mutation"

import { createResourceCommentMock } from "./resource-comments-mock"
import type { CreateResourceCommentInput, ResourceCommentItem } from "./resource-comments-mock"
import { resourceCommentsSwrKey } from "./useQueryResourceCommentsSwr"
import type { ResourceCommentsSwrKey } from "./useQueryResourceCommentsSwr"

/**
 * Creates a comment (optional `parentId` makes it a one-level reply) with an
 * optimistic append into the comments cache and rollback on error. Mocked;
 * the trigger throws on failure so callers can keep the draft + show an error.
 * @param resourceId - The resource being commented on.
 */
export const useMutateCreateResourceCommentSwr = (resourceId: string) => {
    const { trigger, isMutating } = useSWRMutation<
        Array<ResourceCommentItem>,
        Error,
        ResourceCommentsSwrKey,
        CreateResourceCommentInput
    >(
        resourceCommentsSwrKey(resourceId),
        ([, id], { arg }) => createResourceCommentMock(id, arg),
    )

    const createComment = useCallback(
        (input: CreateResourceCommentInput) => {
            // temp item shown until the mock "server" list replaces the cache
            const optimistic: ResourceCommentItem = {
                id: `temp-${Date.now()}`,
                parentId: input.parentId,
                author: { ...input.author },
                text: input.text,
                createdAt: new Date().toISOString(),
                likeCount: 0,
                likedByMe: false,
            }
            return trigger(input, {
                optimisticData: (current) => [...(current ?? []), optimistic],
                populateCache: true,
                rollbackOnError: true,
                revalidate: false,
            })
        },
        [trigger],
    )

    return { createComment, isMutating }
}
