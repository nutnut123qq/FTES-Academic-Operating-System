"use client"

import useSWR from "swr"
import { getMyQuests, type QuestBoardView } from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"

/** Shared SWR key — the quest board page, analytics DailyQuest widget and the
 * quest-completion toast host all read ONE cache. */
export const GET_MY_QUESTS_SWR_KEY = "GET_MY_QUESTS_SWR"

/**
 * SWR query for the current user's daily quest board
 * ({@link getMyQuests}, `GET /api/v1/gamification/me/quests`).
 *
 * Auth-gated: guests key to `null` so the `/me/*` endpoint is never fired and
 * `data === undefined`. Polls every 60s because coin auto-credit happens on a
 * backend worker (no socket) — `refreshInterval` keeps the board and the wallet
 * chip in step without a manual reload.
 */
export const useGetMyQuestsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR<QuestBoardView, Error>(
        authenticated ? [GET_MY_QUESTS_SWR_KEY] : null,
        () => getMyQuests(),
        { refreshInterval: 60_000 },
    )

    return swr
}
