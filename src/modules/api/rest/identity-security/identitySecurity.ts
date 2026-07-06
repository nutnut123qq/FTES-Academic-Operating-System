import { restRequest } from "@/modules/api/rest/client"
import type {
    SecurityAdminLogRequest,
    SecurityAdminSessionView,
    SecurityDeviceView,
    SecurityLockRequest,
    SecurityLoginHistoryRequest,
    SecurityLoginHistoryView,
    SecurityLogView,
    SecurityMessageResponse,
    SecurityPageResponse,
    SecurityVerificationStatusView,
} from "./types"

// ---------------- DeviceController ----------------

export const listSecurityDevices = async (): Promise<SecurityDeviceView[]> =>
    restRequest<SecurityDeviceView[]>({
        method: "GET",
        url: "/identity/devices",
    })

export const trustSecurityDevice = async (
    id: string,
): Promise<SecurityMessageResponse> =>
    restRequest<SecurityMessageResponse>({
        method: "POST",
        url: `/identity/devices/${id}/trust`,
    })

export const untrustSecurityDevice = async (
    id: string,
): Promise<SecurityMessageResponse> =>
    restRequest<SecurityMessageResponse>({
        method: "DELETE",
        url: `/identity/devices/${id}/trust`,
    })

export const revokeSecurityDevice = async (
    id: string,
): Promise<SecurityMessageResponse> =>
    restRequest<SecurityMessageResponse>({
        method: "DELETE",
        url: `/identity/devices/${id}`,
    })

// ---------------- LoginHistoryController ----------------

export const getMyLoginHistory = async (
    request?: SecurityLoginHistoryRequest,
): Promise<SecurityPageResponse<SecurityLoginHistoryView>> =>
    restRequest<SecurityPageResponse<SecurityLoginHistoryView>>({
        method: "GET",
        url: "/identity/login-history",
        params: {
            page: request?.page,
            size: request?.size,
            result: request?.result,
        },
    })

export const getMyVerificationStatus = async (): Promise<
    SecurityVerificationStatusView
> =>
    restRequest<SecurityVerificationStatusView>({
        method: "GET",
        url: "/identity/me/verification-status",
    })

// ---------------- AdminSecurityController ----------------

export const listSecurityAdminUserSessions = async (
    userId: string,
): Promise<SecurityAdminSessionView[]> =>
    restRequest<SecurityAdminSessionView[]>({
        method: "GET",
        url: `/identity/admin/users/${userId}/sessions`,
    })

export const revokeAllSecurityAdminUserSessions = async (
    userId: string,
): Promise<SecurityMessageResponse> =>
    restRequest<SecurityMessageResponse>({
        method: "DELETE",
        url: `/identity/admin/users/${userId}/sessions`,
    })

export const revokeSecurityAdminUserSession = async (
    userId: string,
    sid: string,
): Promise<SecurityMessageResponse> =>
    restRequest<SecurityMessageResponse>({
        method: "DELETE",
        url: `/identity/admin/users/${userId}/sessions/${sid}`,
    })

export const getSecurityAdminUserLoginHistory = async (
    userId: string,
    request?: SecurityLoginHistoryRequest,
): Promise<SecurityPageResponse<SecurityLoginHistoryView>> =>
    restRequest<SecurityPageResponse<SecurityLoginHistoryView>>({
        method: "GET",
        url: `/identity/admin/users/${userId}/login-history`,
        params: {
            page: request?.page,
            size: request?.size,
            result: request?.result,
        },
    })

export const lockSecurityAdminUser = async (
    userId: string,
    request: SecurityLockRequest,
): Promise<SecurityMessageResponse> =>
    restRequest<SecurityMessageResponse>({
        method: "POST",
        url: `/identity/admin/users/${userId}/lock`,
        data: request,
    })

export const unlockSecurityAdminUser = async (
    userId: string,
): Promise<SecurityMessageResponse> =>
    restRequest<SecurityMessageResponse>({
        method: "POST",
        url: `/identity/admin/users/${userId}/unlock`,
    })

export const querySecurityAdminLog = async (
    request?: SecurityAdminLogRequest,
): Promise<SecurityLogView[]> =>
    restRequest<SecurityLogView[]>({
        method: "GET",
        url: "/identity/admin/security-log",
        params: {
            userId: request?.userId,
            eventType: request?.eventType,
            from: request?.from,
            to: request?.to,
            page: request?.page,
            size: request?.size,
        },
    })
