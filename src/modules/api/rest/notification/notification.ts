import { restRequest } from "@/modules/api/rest/client"
import type {
    MuteRequest,
    MuteView,
    NotificationBadge,
    NotificationItem,
    NotificationListPage,
    NotificationListParams,
    NotificationPageView,
    NotificationView,
    PreferenceCell,
    PreferenceUpdate,
    TemplateRequest,
    TemplateView,
    UnreadCount,
} from "./types"

// ---------------------------------------------------------------- NotificationController

/** How many recent notifications the bell/badge fetches at once. */
const BADGE_PAGE_SIZE = 20

/** Map a backend {@link NotificationView} onto the FE {@link NotificationItem}. */
const toNotificationItem = (view: NotificationView): NotificationItem => ({
    id: view.id,
    type: view.type,
    title: view.title,
    body: view.body ? view.body : null,
    isRead: view.status !== "UNREAD",
    deepLink: view.deepLink ? view.deepLink : null,
    createdAt: view.createdAt,
})

/**
 * Lists the current user's in-app notifications (newest first), mapped to
 * {@link NotificationItem}. Auth-scoped: the backend filters `user_id = principal`.
 *
 * `GET /api/v1/notifications`
 */
export const getNotifications = async (
    params: NotificationListParams = {},
): Promise<NotificationListPage> => {
    const search = new URLSearchParams()
    if (params.status) search.set("status", params.status)
    if (params.type) search.set("type", params.type)
    if (params.page !== undefined) search.set("page", String(params.page))
    if (params.size !== undefined) search.set("size", String(params.size))
    const qs = search.toString()
    const page = await restRequest<NotificationPageView<NotificationView>>({
        method: "GET",
        url: `/notifications${qs ? `?${qs}` : ""}`,
        authenticated: true,
    })
    return {
        items: (page?.items ?? []).map(toNotificationItem),
        page: page?.page ?? 0,
        total: page?.total ?? 0,
        totalPages: page?.totalPages ?? 0,
    }
}

/**
 * Returns the current user's unread notification count for the bell badge.
 *
 * `GET /api/v1/notifications/unread-count`
 */
export const getUnreadCount = async (): Promise<number> => {
    const res = await restRequest<UnreadCount>({
        method: "GET",
        url: "/notifications/unread-count",
        authenticated: true,
    })
    return res?.count ?? 0
}

/**
 * Fetches the recent notification page + unread count in one round trip (bell +
 * badge). The count query degrades to 0 on failure so the list still renders.
 */
export const getNotificationBadge = async (): Promise<NotificationBadge> => {
    const [page, unreadCount] = await Promise.all([
        getNotifications({ size: BADGE_PAGE_SIZE }),
        getUnreadCount().catch(() => 0),
    ])
    return { items: page.items, unreadCount }
}

/**
 * Marks a single notification read.
 *
 * `POST /api/v1/notifications/{id}/read`
 */
export const markNotificationRead = async (id: string): Promise<void> => {
    await restRequest<void>({
        method: "POST",
        url: `/notifications/${id}/read`,
    })
}

/**
 * Marks every unread notification read in one bulk action.
 *
 * `POST /api/v1/notifications/read-all`
 */
export const markAllNotificationsRead = async (): Promise<void> => {
    await restRequest<void>({
        method: "POST",
        url: "/notifications/read-all",
    })
}

// ---------------------------------------------------------------- NotificationController (preferences/mutes)

/**
 * Returns the current user's notification preference matrix.
 *
 * `GET /api/v1/notifications/preferences`
 */
export const getNotificationPreferences = async (): Promise<
    Array<PreferenceCell>
> => {
    return restRequest<Array<PreferenceCell>>({
        method: "GET",
        url: "/notifications/preferences",
    })
}

/**
 * Replaces the current user's notification preferences.
 *
 * `PUT /api/v1/notifications/preferences`
 */
export const putNotificationPreferences = async (
    request: Array<PreferenceUpdate>,
): Promise<Array<PreferenceCell>> => {
    return restRequest<Array<PreferenceCell>>({
        method: "PUT",
        url: "/notifications/preferences",
        data: request,
    })
}

/**
 * Returns the current user's active notification mutes.
 *
 * `GET /api/v1/notifications/mutes`
 */
export const getNotificationMutes = async (): Promise<Array<MuteView>> => {
    return restRequest<Array<MuteView>>({
        method: "GET",
        url: "/notifications/mutes",
    })
}

/**
 * Creates a new notification mute for the current user.
 *
 * `POST /api/v1/notifications/mutes`
 */
export const createNotificationMute = async (
    request: MuteRequest,
): Promise<MuteView> => {
    return restRequest<MuteView>({
        method: "POST",
        url: "/notifications/mutes",
        data: request,
    })
}

/**
 * Deletes a notification mute for the current user.
 *
 * `DELETE /api/v1/notifications/mutes/{id}`
 */
export const deleteNotificationMute = async (id: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/notifications/mutes/${id}`,
    })
}

// ---------------------------------------------------------------- NotificationTemplateController

/**
 * Lists all notification templates (admin).
 *
 * `GET /api/v1/admin/notification/templates`
 */
export const listNotificationTemplates = async (): Promise<
    Array<TemplateView>
> => {
    return restRequest<Array<TemplateView>>({
        method: "GET",
        url: "/admin/notification/templates",
    })
}

/**
 * Creates a notification template (admin).
 *
 * `POST /api/v1/admin/notification/templates`
 */
export const createNotificationTemplate = async (
    request: TemplateRequest,
): Promise<TemplateView> => {
    return restRequest<TemplateView>({
        method: "POST",
        url: "/admin/notification/templates",
        data: request,
    })
}

/**
 * Updates a notification template (admin).
 *
 * `PUT /api/v1/admin/notification/templates/{id}`
 */
export const updateNotificationTemplate = async (
    id: string,
    request: TemplateRequest,
): Promise<TemplateView> => {
    return restRequest<TemplateView>({
        method: "PUT",
        url: `/admin/notification/templates/${id}`,
        data: request,
    })
}

/**
 * Deletes a notification template (admin).
 *
 * `DELETE /api/v1/admin/notification/templates/{id}`
 */
export const deleteNotificationTemplate = async (id: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/admin/notification/templates/${id}`,
    })
}
