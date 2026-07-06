/**
 * Request/response DTOs for the notification REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.notification.web.dto.NotificationViews`.
 */

/** Generic paginated view used by the notification domain. */
export interface NotificationPageView<T> {
    items: Array<T>
    page: number
    size: number
    total: number
    totalPages: number
}

/** In-app notification returned by the REST list endpoint. */
export interface NotificationView {
    id: string
    type: string
    title: string
    body: string
    deepLink: string
    refType: string
    refId: string
    groupCount: number
    status: string
    createdAt: string
    readAt: string | null
}

/** One cell in the notification preference matrix. */
export interface PreferenceCell {
    type: string
    channel: string
    enabled: boolean
}

/** Body item sent to `PUT /api/v1/notifications/preferences`. */
export interface PreferenceUpdate {
    type: string
    channel: string
    enabled: boolean
}

/** An active notification mute. */
export interface MuteView {
    id: string
    scopeType: string
    scopeId: string
    mutedUntil: string | null
    createdAt: string
}

/** Body sent to `POST /api/v1/notifications/mutes`. */
export interface MuteRequest {
    scopeType: string
    scopeId: string
    mutedUntil?: string | null
}

/** Unread count payload. */
export interface UnreadCount {
    count: number
}

/** Body sent to `POST /api/v1/admin/notification/templates` and `PUT .../{id}`. */
export interface TemplateRequest {
    code: string
    channel: string
    locale: string
    subject: string
    body: string
    active?: boolean | null
}

/** Admin notification template view. */
export interface TemplateView {
    id: string
    code: string
    channel: string
    locale: string
    subject: string
    body: string
    active: boolean
    updatedAt: string
}
