"use client"

import useSWR from "swr"
import { getMyQuests, type QuestBoardView } from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** Key prefix — module-private on purpose (see {@link myQuestsSwrKey}). */
const GET_MY_QUESTS_SWR_KEY = "GET_MY_QUESTS_SWR"

/**
 * The SWR key this hook subscribes to — the quest board page, the analytics
 * DailyQuest widget and the quest-completion toast host all read ONE cache.
 *
 * Exported as a BUILDER rather than a bare prefix so a call site cannot rebuild the
 * array by hand and silently drift from the hook: the viewer id is part of the key,
 * and a hand-written `["GET_MY_QUESTS_SWR"]` would match nothing.
 *
 * @param viewerId - the signed-in viewer's id ({@link useViewerScopeId}).
 */
export const myQuestsSwrKey = (viewerId: string) => [GET_MY_QUESTS_SWR_KEY, viewerId]

/**
 * SWR query for the current user's daily quest board
 * ({@link getMyQuests}, `GET /api/v1/gamification/me/quests`).
 *
 * Auth-gated: guests key to `null` so the `/me/*` endpoint is never fired and
 * `data === undefined`. Polls every 60s because coin auto-credit happens on a
 * backend worker (no socket) — `refreshInterval` keeps the board and the wallet
 * chip in step without a manual reload. Also revalidates on window focus (the
 * global `SwrProvider` disables it) so returning to the tab after earning a quest
 * in another surface flips the board immediately instead of waiting up to 60s.
 *
 * The key also carries the VIEWER ID ({@link useViewerScopeId}). "Somebody is signed
 * in" is not an identity: on the bare key, signing out of A and into B in the same tab
 * re-keys to the same cache entry and B reads A's quest progress straight from the
 * cache — and the diff-based toast host fires phantom completions off A's snapshot.
 */
export const useGetMyQuestsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<QuestBoardView, Error>(
        authenticated && viewerId ? myQuestsSwrKey(viewerId) : null,
        () => getMyQuests(),
        { refreshInterval: 60_000, revalidateOnFocus: true },
    )

    return swr
}
