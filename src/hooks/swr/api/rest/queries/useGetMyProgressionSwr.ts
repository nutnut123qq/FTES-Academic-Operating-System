"use client"

import useSWR from "swr"
import {
    getMyProgression,
    type ProgressionView,
} from "@/modules/api/rest/gamification"
import { useAppSelector } from "@/redux/hooks"

/** Shared SWR key — the composed viewer snapshot (dropdown + profile) and the
 * level-up toast host read ONE cache. */
export const GET_MY_PROGRESSION_SWR_KEY = "GET_MY_PROGRESSION_SWR"

/**
 * SWR query for the current user's XP/level progression snapshot
 * ({@link getMyProgression}, `GET /api/v1/gamification/me/progression`).
 *
 * Auth-gated: guests key to `null` so the `/me/*` endpoint is never fired and
 * `data === undefined`.
 *
 * Polls on a 60s `refreshInterval`. The global {@link SwrProvider} disables
 * `revalidateOnFocus`/`revalidateOnReconnect`, so without an explicit interval
 * this snapshot would freeze at its first fetch once mounted persistently in the
 * composed viewer snapshot — the "live" XP/level in the dropdown and profile
 * would go stale and the level-up celebration would never re-trigger. XP accrues
 * on a backend worker with no socket, so polling is the revalidation path (same
 * cadence as the quest board).
 */
export const useGetMyProgressionSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const swr = useSWR<ProgressionView, Error>(
        authenticated ? [GET_MY_PROGRESSION_SWR_KEY] : null,
        () => getMyProgression(),
        { refreshInterval: 60_000 },
    )

    return swr
}
