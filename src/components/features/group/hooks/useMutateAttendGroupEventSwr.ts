"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { attendGroupEvent, unattendGroupEvent } from "@/modules/api/rest/group"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useRestWithToast } from "@/modules/toast/hooks"
import { matchesGroupEventsKey, type GroupEvent } from "./useQueryGroupEventsSwr"

/**
 * Toggles the current user's RSVP on a group event via the real REST endpoints
 * (`POST/DELETE /groups/{id}/events/{eventId}/attend` — change
 * group-identity-media-rules-rsvp). Optimistic: flip `attending` + `attendeeCount`
 * on the `["GET_GROUP_EVENTS", groupId]` cache; then the BE returns the fresh
 * `EventDto` whose server-truth `attendeeCount`/`attending` is reconciled back into
 * the cache (so a concurrent RSVP by someone else doesn't leave a stale count).
 * On failure the error is toasted and the row re-fetches. Guests get the
 * `AuthenticationModal` and nothing toggles.
 *
 * @param groupId - the owning group id.
 */
export const useMutateAttendGroupEventSwr = (groupId: string) => {
    const { mutate } = useSWRConfig()
    const { requireAuth } = useRequireAuth()
    const runRest = useRestWithToast()

    return useCallback(
        async (eventId: string) => {
            if (!requireAuth("auth.context.generic")) {
                return
            }

            let wasAttending = false
            await mutate<Array<GroupEvent>>(
                matchesGroupEventsKey(groupId),
                (current) =>
                    current?.map((event) => {
                        if (event.id !== eventId) {
                            return event
                        }
                        wasAttending = event.attending
                        const nextAttending = !event.attending
                        return {
                            ...event,
                            attending: nextAttending,
                            attendeeCount: Math.max(0, event.attendeeCount + (nextAttending ? 1 : -1)),
                        }
                    }),
                { revalidate: false },
            )

            // A toggle is silent on success (the row already flipped optimistically) but
            // toasts on failure — every other mutation surfaces its error the same way.
            const updated = await runRest(
                () =>
                    wasAttending
                        ? unattendGroupEvent(groupId, eventId)
                        : attendGroupEvent(groupId, eventId),
                { showSuccessToast: false },
            )

            if (!updated) {
                // rollback: re-fetch server truth
                await mutate(matchesGroupEventsKey(groupId))
                return
            }

            // Reconcile the BE's authoritative count/attending (may differ from the
            // optimistic ±1 under concurrent RSVPs); dateLabel/title/location are unchanged.
            await mutate<Array<GroupEvent>>(
                matchesGroupEventsKey(groupId),
                (current) =>
                    current?.map((event) =>
                        event.id === eventId
                            ? {
                                  ...event,
                                  attendeeCount: updated.attendeeCount,
                                  attending: updated.attending,
                              }
                            : event,
                    ),
                { revalidate: false },
            )
        },
        [groupId, mutate, requireAuth, runRest],
    )
}
