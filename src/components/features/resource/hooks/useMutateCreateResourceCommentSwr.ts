"use client"

import useSWRMutation from "swr/mutation"

import {
    postResourceComment,
    type PostResourceCommentRequest,
    type ResourceCommentView,
} from "@/modules/api/rest/resource"

/** Trigger arg: the resource + the comment/reply payload. */
export interface CreateResourceCommentArg {
    resourceId: string
    request: PostResourceCommentRequest
}

/**
 * Posts a resource Q&A comment (or a one-level reply via `parentId`) to the real
 * C-4 BE (`POST /api/v1/resources/{id}/comments`). The caller revalidates the
 * comments page on success; `trigger` rejects on failure so the draft is kept.
 * Mirrors `usePostLessonCommentSwr`.
 */
export const useMutateCreateResourceCommentSwr = () => {
    return useSWRMutation<
        ResourceCommentView,
        Error,
        "RESOURCE_COMMENT_CREATE",
        CreateResourceCommentArg
    >("RESOURCE_COMMENT_CREATE", (_key, { arg }) =>
        postResourceComment(arg.resourceId, arg.request),
    )
}
