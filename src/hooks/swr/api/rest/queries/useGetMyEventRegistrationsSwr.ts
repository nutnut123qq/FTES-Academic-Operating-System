"use client"

import useSWR from "swr"
import {
    getMyEventRegistrations,
    type EventRegistrationView,
} from "@/modules/api/rest/event"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's event registrations. */
export const MY_EVENT_REGISTRATIONS_SWR_KEY = "GET_MY_EVENT_REGISTRATIONS_SWR"

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyEventRegistrationsSwr}. `null`
 * disables the fetch (guest, or the `me` query still in flight). Import this from a
 * call site that needs to `mutate` the entry — never hand-write the tuple.
 */
export const myEventRegistrationsKey = (viewerId: string | null) =>
    viewerId ? ([MY_EVENT_REGISTRATIONS_SWR_KEY, viewerId] as const) : null

/**
 * SWR query wrapper for {@link getMyEventRegistrations}.
 *
 * The key carries the VIEWER ID: which events an account signed up for is personal, and
 * on the shared key B's "my events" list would show A's seats (and A's waitlist state).
 *
 * Note this key is deliberately NOT under the shared `events` prefix that
 * `useMutateEventRegistrationSwr` revalidates — that matcher only sweeps the public
 * catalogue/detail caches, and this hook exposes its own `mutate`.
 */
export const useGetMyEventRegistrationsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<EventRegistrationView[], Error>(
        authenticated ? myEventRegistrationsKey(viewerId) : null,
        () => getMyEventRegistrations(),
    )

    return swr
}
