"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { attendGroupEvent, unattendGroupEvent } from "@/modules/api/rest/group"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { matchesGroupEventsKey, type GroupEvent } from "./useQueryGroupEventsSwr"

/**
 * Toggles the current user's RSVP on a group event via the real REST endpoints
 * (`POST/DELETE /groups/{id}/events/{eventId}/attend` — change
 * group-identity-media-rules-rsvp). Optimistic: flip `attending` + `attendeeCount`
 * on the `["GET_GROUP_EVENTS", groupId]` cache, then call the BE; roll back on
 * failure. Guests get the `AuthenticationModal` and nothing toggles.
 *
 * @param groupId - the owning group id.
 */
export const useMutateAttendGroupEventSwr = (groupId: string) => {
    const { mutate } = useSWRConfig()
    const { requireAuth } = useRequireAuth()

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

            try {
                if (wasAttending) {
                    await unattendGroupEvent(groupId, eventId)
                } else {
                    await attendGroupEvent(groupId, eventId)
                }
            } catch {
                // rollback: re-fetch server truth
                await mutate(matchesGroupEventsKey(groupId))
            }
        },
        [groupId, mutate, requireAuth],
    )
}
