"use client"

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react"
import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
import { useLocale } from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import { Discussion } from "@/components/reuseable/Discussion"
import { GraphQLHeadersKey, type GraphQLHeaders } from "@/modules/api/graphql/types"
import { mutateCreateComment } from "@/modules/api/graphql/mutations/mutation-create-comment"
import { mutateDeleteComment } from "@/modules/api/graphql/mutations/mutation-delete-comment"
import { mutateReactToComment } from "@/modules/api/graphql/mutations/mutation-react-to-comment"
import { mutateUpdateComment } from "@/modules/api/graphql/mutations/mutation-update-comment"
import { queryContentComments } from "@/modules/api/graphql/queries/query-content-comments"
import { queryContentReactions } from "@/modules/api/graphql/queries/query-content-reactions"
import { ReactionType, type CommentNode } from "@/modules/api/graphql/queries/types/discussion"
import { contentDiscussionSocketIoEventEmitter } from "@/hooks/socketio/useContentDiscussionSocketIoLifecycle"
import { PublicationEvent } from "@/hooks/socketio/enums/publication-event"
import { SubscriptionEvent } from "@/hooks/socketio/enums/subscription-event"
import { useContentDiscussionSocketIo } from "@/hooks/socketio/useContentDiscussionSocketIo"
import { type SubscribeContentDiscussionSocketIoPayload } from "@/hooks/socketio/types/content-discussion"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Page size for a parent's replies (loaded in one shot per parent). */
const REPLIES_LIMIT = 50

/** Page size for the paginated top-level comment list ("load more"). */
const COMMENTS_PAGE_SIZE = 10

/** Server → client discussion events this container reacts to (revalidate on any). */
const DISCUSSION_EVENTS: ReadonlyArray<SubscriptionEvent> = [
    SubscriptionEvent.CommentCreated,
    SubscriptionEvent.CommentUpdated,
    SubscriptionEvent.CommentDeleted,
    SubscriptionEvent.ContentReactionChanged,
    SubscriptionEvent.CommentReactionChanged,
]

/**
 * Container for the lesson-content threaded comments.
 *
 * Owns the comment data hooks (local SWR), the realtime socket subscription (for BOTH
 * comment and reaction events), and all comment persistence callbacks; renders the
 * presentational {@link Discussion} (comments only — frameless). Rendered below the reading
 * card by {@link LessonReader}. The reaction picker itself lives in the reading-card footer
 * ({@link ContentReactionBar}); this container only keeps the reaction SWR alive so socket
 * events refresh that bar via the shared cache key. `"use client"` for hooks + socket.
 */
export const ContentDiscussion = ({ className }: WithClassNames<undefined>) => {
    const locale = useLocale()
    const contentId = useAppSelector((state) => state.content.entity?.id)
    const currentUser = useAppSelector((state) => state.user.user)
    const currentUserId = currentUser?.id ?? null
    // the enrolled-guard on every discussion resolver requires the X-Course-Id header
    const courseId = useAppSelector((state) => state.course.entity?.id)
    const socket = useContentDiscussionSocketIo()

    // course header sent on every discussion call so GraphQLMustEnrolledGuard passes
    const courseHeaders: GraphQLHeaders | undefined = courseId
        ? {
            [GraphQLHeadersKey.XCourseId]: courseId,
        }
        : undefined

    // replies loaded on demand, keyed by parent comment id
    const [repliesByParent, setRepliesByParent] = useState<Record<string, Array<CommentNode>>>({})
    // track which parents have replies loaded so realtime can refresh exactly those
    const loadedParentsRef = useRef<Set<string>>(new Set())

    // content-level reaction summary — kept here ONLY to revalidate on realtime
    // ContentReactionChanged events; the reaction bar itself ({@link ContentReactionBar},
    // rendered in the reading-card footer) holds an SWR with this SAME key, so a
    // socket-driven mutate() here refreshes the bar through the shared cache.
    const reactionsSwr = useSWR(
        contentId && courseId ? ["content-discussion-reactions", contentId] : null,
        async () => {
            const response = await queryContentReactions({
                request: {
                    contentId: contentId as string,
                },
                headers: courseHeaders,
            })
            return response.data?.contentReactions.data
        },
    )

    // top-level comments, paginated for "load more"; each page is one API call
    const commentsSwr = useSWRInfinite(
        (pageIndex, previousPageData) => {
            // need both content + course (header) before any call (else the guard 400s)
            if (!contentId || !courseId) {
                return null
            }
            // stop paginating once a page comes back empty (reached the end)
            if (previousPageData && (previousPageData.comments?.length ?? 0) === 0) {
                return null
            }
            // 1-based page in the key tuple
            return ["content-discussion-comments", contentId, pageIndex + 1] as const
        },
        async ([, , page]) => {
            const response = await queryContentComments({
                request: {
                    contentId: contentId as string,
                    page,
                    limit: COMMENTS_PAGE_SIZE,
                },
                headers: courseHeaders,
            })
            return response.data?.contentComments.data
        },
    )

    // flatten loaded pages into a single comment list; total comes from the first page
    const commentPages = commentsSwr.data ?? []
    const comments = commentPages.flatMap((page) => page?.comments ?? [])
    const total = commentPages[0]?.total ?? 0
    // more remain while we have not yet accumulated the reported total
    const hasMore = comments.length < total
    // the last requested page is still resolving
    const isLoadingMore = commentsSwr.isValidating
        && commentsSwr.data !== undefined
        && typeof commentsSwr.data[commentsSwr.size - 1] === "undefined"

    // fetch a parent's replies and cache them in state
    const loadReplies = useCallback(async (parentId: string) => {
        if (!contentId || !courseId) {
            return
        }
        const response = await queryContentComments({
            request: {
                contentId,
                parentCommentId: parentId,
                limit: REPLIES_LIMIT,
            },
            headers: courseHeaders,
        })
        const replies = response.data?.contentComments.data?.comments ?? []
        // remember this parent so realtime updates can refresh it later
        loadedParentsRef.current.add(parentId)
        setRepliesByParent((prev) => ({
            ...prev,
            [parentId]: replies,
        }))
    }, [contentId, courseId, courseHeaders])

    // re-fetch every already-loaded reply subtree (used after a realtime event)
    const reloadLoadedReplies = useCallback(() => {
        loadedParentsRef.current.forEach((parentId) => {
            void loadReplies(parentId)
        })
    }, [loadReplies])

    // single revalidation entry point for any discussion change
    const revalidateAll = useCallback(() => {
        void reactionsSwr.mutate()
        void commentsSwr.mutate()
        reloadLoadedReplies()
    }, [reactionsSwr, commentsSwr, reloadLoadedReplies])

    // join the content's discussion room (and re-join on reconnect)
    useEffect(() => {
        if (!contentId || !courseId) {
            return
        }
        const subscribe = () => {
            const payload: SubscribeContentDiscussionSocketIoPayload = {
                data: {
                    contentId,
                },
                locale,
            }
            socket.emit(PublicationEvent.SubscribeContentDiscussion, payload)
        }
        // subscribe now if already connected, and again on every (re)connect
        if (socket.connected) {
            subscribe()
        }
        socket.on("connect", subscribe)
        return () => {
            socket.off("connect", subscribe)
        }
    }, [socket, contentId, courseId, locale])

    // refetch affected data whenever a realtime event arrives for this content
    useEffect(() => {
        if (!contentId || !courseId) {
            return
        }
        const handler = (message: { data?: { contentId?: string } }) => {
            // ignore events for other contents sharing the same socket
            if (message?.data?.contentId !== contentId) {
                return
            }
            revalidateAll()
        }
        DISCUSSION_EVENTS.forEach((event) => contentDiscussionSocketIoEventEmitter.on(event, handler))
        return () => {
            DISCUSSION_EVENTS.forEach((event) => contentDiscussionSocketIoEventEmitter.off(event, handler))
        }
    }, [contentId, courseId, revalidateAll])

    // --- persistence callbacks (optimistic-free: mutate then revalidate) ---

    const onSubmitComment = useCallback(async (body: string) => {
        if (!contentId || !courseId) {
            return
        }
        await mutateCreateComment({
            request: {
                contentId,
                body,
            },
            headers: courseHeaders,
        })
        void commentsSwr.mutate()
    }, [contentId, courseId, courseHeaders, commentsSwr])

    const onReply = useCallback(async (parentId: string, body: string) => {
        if (!contentId || !courseId) {
            return
        }
        await mutateCreateComment({
            request: {
                contentId,
                parentCommentId: parentId,
                body,
            },
            headers: courseHeaders,
        })
        // reply count + the subtree both changed
        void commentsSwr.mutate()
        void loadReplies(parentId)
    }, [contentId, courseId, courseHeaders, commentsSwr, loadReplies])

    const onEdit = useCallback(async (commentId: string, body: string) => {
        if (!courseId) {
            return
        }
        await mutateUpdateComment({
            request: {
                commentId,
                body,
            },
            headers: courseHeaders,
        })
        revalidateAll()
    }, [courseId, courseHeaders, revalidateAll])

    const onDelete = useCallback(async (commentId: string) => {
        if (!courseId) {
            return
        }
        await mutateDeleteComment({
            request: {
                commentId,
            },
            headers: courseHeaders,
        })
        revalidateAll()
    }, [courseId, courseHeaders, revalidateAll])

    const onReactComment = useCallback(async (commentId: string, type: ReactionType | null) => {
        if (!courseId) {
            return
        }
        await mutateReactToComment({
            request: {
                commentId,
                type,
            },
            headers: courseHeaders,
        })
        revalidateAll()
    }, [courseId, courseHeaders, revalidateAll])

    const onLoadReplies = useCallback((parentId: string) => {
        void loadReplies(parentId)
    }, [loadReplies])

    // hide the whole section until both content id and course id are available —
    // course id is required by the GraphQLMustEnrolledGuard on every discussion resolver
    if (!contentId || !courseId) {
        return null
    }

    return (
        <Discussion
            className={className}
            // discussion data
            currentUserId={currentUserId}
            currentUser={currentUser ? { username: currentUser.username, avatar: currentUser.avatar } : null}
            comments={comments}
            total={total}
            isLoading={commentsSwr.isLoading}
            repliesByParent={repliesByParent}
            onSubmitComment={onSubmitComment}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            onReactComment={onReactComment}
            onLoadReplies={onLoadReplies}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => void commentsSwr.setSize(commentsSwr.size + 1)}
        />
    )
}
