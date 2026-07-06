/**
 * Request/response DTOs for the identity security REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.identity.security.web.DeviceController`,
 * `vn.ftes.aos.identity.security.web.LoginHistoryController`,
 * `vn.ftes.aos.identity.security.web.AdminSecurityController`, and the DTOs in
 * `vn.ftes.aos.identity.security.web.dto.SecurityDtos`.
 *
 * All exported names are prefixed with `Security` to avoid collisions in the
 * shared `src/modules/api/rest/index.ts` barrel.
 */

// ---------------- DeviceController ----------------

export interface SecurityDeviceView {
    id: string
    displayName: string
    platform: string
    browser: string
    trusted: boolean
    firstSeenAt: string
    lastSeenAt: string
    current: boolean
}

// ---------------- LoginHistoryController ----------------

export interface SecurityLoginHistoryView {
    id: string
    result: string
    method: string
    ip: string
    userAgent: string
    deviceId?: string
    occurredAt: string
}

export interface SecurityPageResponse<T> {
    items: T[]
    page: number
    size: number
    totalElements: number
}

export interface SecurityVerificationStatusView {
    emailVerified: boolean
    phoneVerified: boolean
    mfaEnabled: boolean
}

export interface SecurityLoginHistoryRequest {
    page?: number
    size?: number
    result?: string
}

// ---------------- AdminSecurityController ----------------

export interface SecurityAdminSessionView {
    sid: string
    deviceInfo: string
    ip: string
    createdAt: string
    lastUsedAt: string
}

export interface SecurityLockRequest {
    reason: string
    unlockAt?: string
}

export interface SecurityLogView {
    id: string
    eventType: string
    userId?: string
    actorId?: string
    ip?: string
    payload: unknown
    occurredAt: string
}

export interface SecurityAdminLogRequest {
    userId?: string
    eventType?: string
    from?: string
    to?: string
    page?: number
    size?: number
}

// ---------------- Generic ack ----------------

export interface SecurityMessageResponse {
    status: string
}
