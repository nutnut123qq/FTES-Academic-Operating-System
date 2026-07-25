"use client"

import useSWR from "swr"
import useSWRInfinite from "swr/infinite"

import { getSessions, type AiSessionView, type MessageView } from "@/modules/api/rest/ai"
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
 * Page-paginated tutor conversations (`GET /ai/sessions?feature=TUTOR_CHAT`) for
 * infinite scroll: a page shorter than {@link TUTOR_SESSIONS_PAGE_SIZE} ends the
 * list.
 *
 * SCOPE CAVEAT (investigated against `SessionController.SessionView`): the BE
 * list projection returns `{id, feature, title, status, messageCount,
 * remainingLessonChats, modelOverride}` and deliberately NOT `contextRef`, so a
 * conversation cannot be attributed to a subject client-side — the list is every
 * TUTOR_CHAT conversation of the caller, not just this subject's. Filtering by
 * subject needs the BE to either expose `contextRef` on the view or accept a
 * `contextRef`/`subjectId` query param.
 *
 * @param enabled - false (e.g. while the conversations view is hidden) suspends fetching.
 */
export const useTutorSessionsInfiniteSwr = (enabled = true) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)

    const getKey = (
        index: number,
        previous: ReadonlyArray<AiSessionView> | null,
    ): readonly [string, number] | null => {
        if (!enabled || !authenticated) {
            return null
        }
        if (previous && previous.length < TUTOR_SESSIONS_PAGE_SIZE) {
            return null
        }
        return ["GET_AI_TUTOR_SESSIONS_INFINITE_SWR", index] as const
    }

    return useSWRInfinite<Array<AiSessionView>, Error>(
        getKey,
        async ([, page]: readonly [string, number]) =>
            (await getSessions({
                feature: "TUTOR_CHAT",
                page,
                size: TUTOR_SESSIONS_PAGE_SIZE,
            })) ?? [],
        { revalidateFirstPage: false },
    )
}
