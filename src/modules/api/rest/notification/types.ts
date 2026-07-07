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

/**
 * FE-facing notification row, mapped from {@link NotificationView}. Server renders
 * `title`/`body` as plain localized strings (no i18n key/params) and snapshots the
 * click destination as a ready `deepLink` route. Read state is derived from the
 * `status` enum (UNREAD/READ/ARCHIVED).
 */
export interface NotificationItem {
    /** Notification row id (UUID). */
    id: string
    /** Backend {@link vn.ftes.aos.notification.domain.NotificationType} name (e.g. `COURSE`). */
    type: string
    /** Server-rendered headline (plain text). */
    title: string
    /** Server-rendered supporting line; null/empty when the title is enough. */
    body: string | null
    /** Whether the recipient has read it (status !== UNREAD). */
    isRead: boolean
    /** Ready app-relative click destination; null for targetless messages. */
    deepLink: string | null
    /** When the notification was created (ISO). */
    createdAt: string
}

/** Mapped page for the notification center list. */
export interface NotificationListPage {
    /** Notification rows for the requested page, newest first. */
    items: Array<NotificationItem>
    /** 0-based page index echoed by the backend. */
    page: number
    /** Total rows matching the filter (across all pages). */
    total: number
    /** Total page count for the filter. */
    totalPages: number
}

/** Query params for `GET /api/v1/notifications`. */
export interface NotificationListParams {
    /** Status filter (`UNREAD` / `READ` / `ARCHIVED`); omitted = all. */
    status?: string
    /** Type filter (backend `NotificationType` name); omitted = all. */
    type?: string
    /** 0-based page index (server default 0). */
    page?: number
    /** Page size (server default 20). */
    size?: number
}

/** Badge payload: the recent page plus the unread count (bell + badge). */
export interface NotificationBadge {
    /** Recent notification rows (newest first, page 0). */
    items: Array<NotificationItem>
    /** Unread notification count for the user (badge value). */
    unreadCount: number
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
