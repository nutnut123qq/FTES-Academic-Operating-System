"use client"

import useSWRMutation from "swr/mutation"
import {
    createGroupEvent,
    deleteGroupEvent,
    updateGroupEvent,
    type GroupEvent,
    type GroupEventRequest,
    type GroupEventUpdateRequest,
} from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for `POST /groups/{id}/events`. The trigger THROWS on REST
 * failure so a `runRestWithToast` caller surfaces the error; the caller owns the
 * revalidate of the events cache.
 */
export const usePostCreateGroupEventSwr = () =>
    useSWRMutation<GroupEvent, Error, string, { id: string; request: GroupEventRequest }>(
        "POST_CREATE_GROUP_EVENT_SWR",
        async (_key, { arg }) => createGroupEvent(arg.id, arg.request),
    )

/** SWR mutation wrapper for `PATCH /groups/{id}/events/{eventId}` (partial update). */
export const usePatchGroupEventSwr = () =>
    useSWRMutation<
        GroupEvent,
        Error,
        string,
        { id: string; eventId: string; request: GroupEventUpdateRequest }
    >(
        "PATCH_GROUP_EVENT_SWR",
        async (_key, { arg }) => updateGroupEvent(arg.id, arg.eventId, arg.request),
    )

/** SWR mutation wrapper for `DELETE /groups/{id}/events/{eventId}` (drops its RSVPs too). */
export const useDeleteGroupEventSwr = () =>
    useSWRMutation<void, Error, string, { id: string; eventId: string }>(
        "DELETE_GROUP_EVENT_SWR",
        async (_key, { arg }) => deleteGroupEvent(arg.id, arg.eventId),
    )
