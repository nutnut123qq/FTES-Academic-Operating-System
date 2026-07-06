/**
 * Request/response DTOs for the admin REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.admin.web.AdminConsoleController`,
 * `vn.ftes.aos.admin.web.AdminBulkController`,
 * `vn.ftes.aos.admin.web.AdminContentPublicController`,
 * `vn.ftes.aos.admin.web.AdminAnalyticsProxyController`, and the domain entities
 * in `vn.ftes.aos.admin.domain`.
 *
 * All exported names are prefixed with `Admin` to avoid collisions in the
 * shared `src/modules/api/rest/index.ts` barrel.
 */

// ---------------- AdminConsoleController: Banners ----------------

export interface AdminBanner {
    id: string
    title: string
    imageUrl: string
    linkUrl?: string
    placement: string
    sortOrder: number
    status: string
    startsAt?: string
    endsAt?: string
    createdBy: string
    updatedBy: string
    createdAt: string
    updatedAt: string
}

export interface AdminBannerView {
    id: string
    title: string
    imageUrl: string
    linkUrl?: string
    placement: string
    sortOrder: number
}

export interface AdminCreateBannerRequest {
    title: string
    imageUrl: string
    linkUrl?: string
    placement: string
    sortOrder?: number
    status?: string
    startsAt?: string
    endsAt?: string
}

export interface AdminPatchBannerRequest {
    title?: string
    imageUrl?: string
    linkUrl?: string
    placement?: string
    sortOrder?: number
    status?: string
    startsAt?: string
    endsAt?: string
}

export interface AdminDeleteBannerRequest {
    reason: string
}

// ---------------- AdminConsoleController: Announcements ----------------

export interface AdminAnnouncement {
    id: string
    title: string
    body: string
    severity: string
    audience: string
    channels: string[]
    status: string
    publishAt?: string
    expiresAt?: string
    createdBy: string
    updatedBy: string
    createdAt: string
    updatedAt: string
}

export interface AdminAnnouncementView {
    id: string
    title: string
    body: string
    severity: string
    audience: string
    channels: string[]
    publishAt?: string
    expiresAt?: string
}

export interface AdminCreateAnnouncementRequest {
    title: string
    body: string
    severity?: string
    audience?: string
    channels?: string[]
    status?: string
    publishAt?: string
    expiresAt?: string
}

export interface AdminPatchAnnouncementRequest {
    title?: string
    body?: string
    severity?: string
    audience?: string
    channels?: string[]
    status?: string
    publishAt?: string
    expiresAt?: string
}

export interface AdminDeleteAnnouncementRequest {
    reason: string
}

// ---------------- AdminBulkController ----------------

export interface AdminBulkBodyRequest {
    targetIds: string[]
    params?: Record<string, unknown>
}

export interface AdminBulkDryRunResult {
    bulkId: string
    confirmToken: string
    preview: Array<Record<string, unknown>>
}

export interface AdminBulkConfirmRequest {
    confirmToken: string
}

export interface AdminBulkOperation {
    id: string
    operationType: string
    targetIds: string
    params: string
    status: string
    dryRunResult?: string
    result?: string
    requestedBy: string
    confirmedAt?: string
    completedAt?: string
    createdAt: string
}

// ---------------- AdminAnalyticsProxyController ----------------

export interface AdminAnalyticsDashboardRequest {
    from?: string
    to?: string
    filter?: string
}
