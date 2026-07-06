import { restRequest } from "@/modules/api/rest/client"
import type {
    ActivityCursorPage,
    ActivityPrivacyOverrideView,
    ActivityReplayRequest,
    ActivityReplayResult,
    ActivityTypeView,
    ActivityView,
} from "./types"

export const getActivityTimeline = async (request?: {
    userId?: string
    contextType?: string
    contextId?: string
    types?: string
    cursor?: string
    limit?: number
}): Promise<ActivityCursorPage<ActivityView>> =>
    restRequest<ActivityCursorPage<ActivityView>>({
        method: "GET",
        url: "/activities",
        params: {
            userId: request?.userId,
            contextType: request?.contextType,
            contextId: request?.contextId,
            types: request?.types,
            cursor: request?.cursor,
            limit: request?.limit,
        },
        authenticated: true,
    })

export const getActivity = async (eventId: string): Promise<ActivityView> =>
    restRequest<ActivityView>({
        method: "GET",
        url: `/activities/${eventId}`,
        authenticated: true,
    })

export const getActivityTypes = async (): Promise<ActivityTypeView[]> =>
    restRequest<ActivityTypeView[]>({
        method: "GET",
        url: "/activities/types",
        authenticated: true,
    })

export const getActivityPrivacySettings = async (): Promise<
    ActivityPrivacyOverrideView[]
> =>
    restRequest<ActivityPrivacyOverrideView[]>({
        method: "GET",
        url: "/activities/privacy-settings",
        authenticated: true,
    })

export const updateActivityPrivacySettings = async (
    request: ActivityPrivacyOverrideView[],
): Promise<ActivityPrivacyOverrideView[]> =>
    restRequest<ActivityPrivacyOverrideView[]>({
        method: "PUT",
        url: "/activities/privacy-settings",
        data: request,
    })

export const replayActivities = async (
    request: ActivityReplayRequest,
): Promise<ActivityReplayResult> =>
    restRequest<ActivityReplayResult>({
        method: "POST",
        url: "/activities/replay",
        data: request,
    })
