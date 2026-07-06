import { restRequest } from "@/modules/api/rest/client"
import type {
    AdminAnalyticsDashboardRequest,
    AdminAnnouncement,
    AdminAnnouncementView,
    AdminBanner,
    AdminBannerView,
    AdminBulkBodyRequest,
    AdminBulkConfirmRequest,
    AdminBulkDryRunResult,
    AdminBulkOperation,
    AdminCreateAnnouncementRequest,
    AdminCreateBannerRequest,
    AdminDeleteAnnouncementRequest,
    AdminDeleteBannerRequest,
    AdminPatchAnnouncementRequest,
    AdminPatchBannerRequest,
} from "./types"

// ---------------- AdminConsoleController: Banners ----------------

export const createAdminBanner = async (
    request: AdminCreateBannerRequest,
): Promise<AdminBanner> =>
    restRequest<AdminBanner>({
        method: "POST",
        url: "/admin/banners",
        data: request,
    })

export const patchAdminBanner = async (
    id: string,
    request: AdminPatchBannerRequest,
): Promise<AdminBanner> =>
    restRequest<AdminBanner>({
        method: "PATCH",
        url: `/admin/banners/${id}`,
        data: request,
    })

export const deleteAdminBanner = async (
    id: string,
    request: AdminDeleteBannerRequest,
): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/admin/banners/${id}`,
        data: request,
    })

// ---------------- AdminConsoleController: Announcements ----------------

export const createAdminAnnouncement = async (
    request: AdminCreateAnnouncementRequest,
): Promise<AdminAnnouncement> =>
    restRequest<AdminAnnouncement>({
        method: "POST",
        url: "/admin/announcements",
        data: request,
    })

export const patchAdminAnnouncement = async (
    id: string,
    request: AdminPatchAnnouncementRequest,
): Promise<AdminAnnouncement> =>
    restRequest<AdminAnnouncement>({
        method: "PATCH",
        url: `/admin/announcements/${id}`,
        data: request,
    })

export const publishAdminAnnouncement = async (
    id: string,
): Promise<AdminAnnouncement> =>
    restRequest<AdminAnnouncement>({
        method: "POST",
        url: `/admin/announcements/${id}/publish`,
    })

export const deleteAdminAnnouncement = async (
    id: string,
    request: AdminDeleteAnnouncementRequest,
): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/admin/announcements/${id}`,
        data: request,
    })

// ---------------- AdminBulkController ----------------

export const bulkLockAdminUsers = async (
    request: AdminBulkBodyRequest,
): Promise<AdminBulkDryRunResult> =>
    restRequest<AdminBulkDryRunResult>({
        method: "POST",
        url: "/admin/users/bulk/lock",
        data: request,
    })

export const bulkUnlockAdminUsers = async (
    request: AdminBulkBodyRequest,
): Promise<AdminBulkDryRunResult> =>
    restRequest<AdminBulkDryRunResult>({
        method: "POST",
        url: "/admin/users/bulk/unlock",
        data: request,
    })

export const confirmAdminBulkOperation = async (
    bulkId: string,
    request: AdminBulkConfirmRequest,
): Promise<AdminBulkOperation> =>
    restRequest<AdminBulkOperation>({
        method: "POST",
        url: `/admin/bulk/${bulkId}/confirm`,
        data: request,
    })

// ---------------- AdminContentPublicController ----------------

export const getAdminPublicBanners = async (
    placement: string,
): Promise<AdminBannerView[]> =>
    restRequest<AdminBannerView[]>({
        method: "GET",
        url: "/admin-content/banners",
        params: {
            placement,
        },
    })

export const getAdminPublicAnnouncements = async (): Promise<
    AdminAnnouncementView[]
> =>
    restRequest<AdminAnnouncementView[]>({
        method: "GET",
        url: "/admin-content/announcements/active",
    })

// ---------------- AdminAnalyticsProxyController ----------------

export const getAdminAnalyticsDashboards = async (): Promise<string[]> =>
    restRequest<string[]>({
        method: "GET",
        url: "/admin/analytics/dashboards",
    })

export const getAdminAnalyticsDashboard = async (
    key: string,
    request?: AdminAnalyticsDashboardRequest,
): Promise<Record<string, unknown>> =>
    restRequest<Record<string, unknown>>({
        method: "GET",
        url: `/admin/analytics/dashboards/${key}`,
        params: {
            from: request?.from,
            to: request?.to,
            filter: request?.filter,
        },
    })
