"use client"

import useSWR from "swr"
import useSWRInfinite from "swr/infinite"

import { listAiSessions, type AiSessionView, type MessageView } from "@/modules/api/rest/ai"
import { useAppSelector } from "@/redux/hooks"

import { getAiSessionMessages } from "./api"

/** Conversations per page (BE clamps `size` to 100; recency-first). */
export const TUTOR_SESSIONS_PAGE_SIZE = 20

/**
 * Transcript of the open tutor session (`GET /ai/sessions/{id}/messages`).
 * Suspended while no session exists yet (a fresh conversation is created lazily
 * on the first send) or while signed out.
 *
 * @param sessionId - open BE session id, or null for a not-yet-created conversation.
 */
export const useAiSessionMessagesSwr = (sessionId: string | null) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const key =
        sessionId && authenticated
            ? (["GET_AI_SESSION_MESSAGES_SWR", sessionId] as const)
            : null

    return useSWR<Array<MessageView>, Error>(
        key,
        ([, id]: readonly [string, string]) => getAiSessionMessages(id),
        { revalidateOnFocus: false },
    )
}

/**
 * Page-paginated tutor conversations of ONE subject
 * (`GET /ai/sessions?feature=TUTOR_CHAT&subjectId=…&status=ACTIVE`) for infinite
 * scroll: a page shorter than {@link TUTOR_SESSIONS_PAGE_SIZE} ends the list.
 *
 * The narrowing happens SERVER-SIDE (change `ai-session-context-filter`): the list
 * matches the `subjectId` stored in each session's `context_ref` and drops archived
 * rows, so the view no longer shows — nor bulk-clears — other subjects' conversations.
 *
 * `subjectId` is the subject's UUID, NOT the code in the route: `context_ref` was
 * written with the UUID at create time, so a code here silently matches nothing.
 * The subject id is part of the SWR key, so switching subject cannot serve the
 * previous subject's cached pages.
 *
 * @param subjectUuid - UUID of the subject; falsy suspends fetching.
 * @param enabled - false (e.g. while the conversations view is hidden) suspends fetching.
 */
export const useTutorSessionsInfiniteSwr = (
    subjectUuid: string | null | undefined,
    enabled = true,
) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const getKey = (
        index: number,
        previous: ReadonlyArray<AiSessionView> | null,
    ): readonly [string, string, number] | null => {
        if (!enabled || !authenticated || !subjectUuid) {
            return null
        }
        if (previous && previous.length < TUTOR_SESSIONS_PAGE_SIZE) {
            return null
        }
        return ["GET_AI_TUTOR_SESSIONS_INFINITE_SWR", subjectUuid, index] as const
    }

    return useSWRInfinite<Array<AiSessionView>, Error>(
        getKey,
        async ([, subjectId, page]: readonly [string, string, number]) =>
            (await listAiSessions({
                feature: "TUTOR_CHAT",
                subjectId,
                status: "ACTIVE",
                page,
                size: TUTOR_SESSIONS_PAGE_SIZE,
            })) ?? [],
        { revalidateFirstPage: false },
    )
}
