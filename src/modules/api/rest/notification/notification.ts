import { restRequest } from "@/modules/api/rest/client"
import type {
    MuteRequest,
    MuteView,
    PreferenceCell,
    PreferenceUpdate,
    TemplateRequest,
    TemplateView,
} from "./types"

// ---------------------------------------------------------------- NotificationController

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
