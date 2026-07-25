"use client"

import useSWR from "swr"
import { getMyInvitations, type GroupMyInvitation } from "@/modules/api/rest/group"
import { useAppSelector } from "@/redux/hooks"

/** SWR cache key of the caller's pending group invitations. */
export const MY_INVITATIONS_KEY = ["GET_MY_INVITATIONS"]

/** How many invitations the inbox pulls (BE caps the parameter at 50). */
const LIMIT = 20

/**
 * Loads the caller's pending group invitations (`GET /invitations/me`). Each row is
 * self-contained — group card + inviter card + `invitationId` — so a row renders and
 * responds without any follow-up request.
 *
 * The endpoint is caller-scoped and requires a session, so the key stays `null` for
 * guests (no request, no 401 toast); signing in mounts the fetch.
 */
export const useQueryMyInvitationsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { data, isLoading, error, mutate } = useSWR(
        authenticated ? MY_INVITATIONS_KEY : null,
        async (): Promise<Array<GroupMyInvitation>> => {
            const invitations = await getMyInvitations({ limit: LIMIT })
            return invitations ?? []
        },
    )
    return { invitations: data ?? [], isLoading, error, mutate, authenticated }
}
