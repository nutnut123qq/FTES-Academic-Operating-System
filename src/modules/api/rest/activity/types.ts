/**
 * Request/response DTOs for the activity REST controller.
 *
 * Mirrors the backend records in `vn.ftes.aos.activity.web.ActivityController`,
 * `vn.ftes.aos.activity.web.dto.ActivityViews`, and
 * `vn.ftes.aos.activity.service.ReplayService`.
 *
 * All exported names are prefixed with `Activity` to avoid collisions in the
 * shared `src/modules/api/rest/index.ts` barrel.
 */

export interface ActivityActorView {
    id: string
    displayName: string
    avatarUrl?: string
}

export interface ActivityRefView {
    type: string
    id: string
}

export interface ActivityView {
    eventId: string
    type: string
    actor: ActivityActorView
    subjectRef: ActivityRefView
    contextRef?: ActivityRefView
    payload: unknown
    occurredAt: string
}

export interface ActivityCursorPage<T> {
    items: T[]
    nextCursor?: string
}

export interface ActivityTypeView {
    type: string
    domain: string
    defaultVisibility: string
    description?: string
}

export interface ActivityPrivacyOverrideView {
    typePattern: string
    visibility: string
}

export interface ActivityReplayRequest {
    consumerGroup: string
    fromOccurredAt: string
    toOccurredAt?: string
    types?: string
}

export interface ActivityReplayResult {
    replayTopic: string
    published: number
}
