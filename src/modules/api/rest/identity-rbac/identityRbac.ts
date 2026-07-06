import { restRequest } from "@/modules/api/rest/client"
import type {
    RbacCheckRequest,
    RbacCheckResponse,
    RbacCreateRoleRequest,
    RbacGrantCreatedResponse,
    RbacGrantPermissionRequest,
    RbacGrantRoleRequest,
    RbacMePermissionsResponse,
    RbacMessageResponseStub,
    RbacPermissionDomainGroup,
    RbacPermissionGrantView,
    RbacReplacePermissionsRequest,
    RbacRoleGrantView,
    RbacRoleSummary,
    RbacRoleView,
    RbacUpdateRoleRequest,
} from "./types"

// ---------------- RoleController ----------------

export const listRbacRoles = async (): Promise<RbacRoleSummary[]> =>
    restRequest<RbacRoleSummary[]>({
        method: "GET",
        url: "/identity/roles",
    })

export const getRbacRole = async (id: string): Promise<RbacRoleView> =>
    restRequest<RbacRoleView>({
        method: "GET",
        url: `/identity/roles/${id}`,
    })

export const createRbacRole = async (
    request: RbacCreateRoleRequest,
): Promise<RbacRoleView> =>
    restRequest<RbacRoleView>({
        method: "POST",
        url: "/identity/roles",
        data: request,
    })

export const updateRbacRole = async (
    id: string,
    request: RbacUpdateRoleRequest,
): Promise<RbacRoleView> =>
    restRequest<RbacRoleView>({
        method: "PATCH",
        url: `/identity/roles/${id}`,
        data: request,
    })

export const deleteRbacRole = async (
    id: string,
): Promise<RbacMessageResponseStub> =>
    restRequest<RbacMessageResponseStub>({
        method: "DELETE",
        url: `/identity/roles/${id}`,
    })

export const replaceRbacRolePermissions = async (
    id: string,
    request: RbacReplacePermissionsRequest,
): Promise<RbacRoleView> =>
    restRequest<RbacRoleView>({
        method: "PUT",
        url: `/identity/roles/${id}/permissions`,
        data: request,
    })

// ---------------- PermissionCatalogController ----------------

export const getRbacPermissionCatalog = async (
    domain?: string,
): Promise<RbacPermissionDomainGroup[]> =>
    restRequest<RbacPermissionDomainGroup[]>({
        method: "GET",
        url: "/identity/permissions",
        params: {
            domain,
        },
    })

// ---------------- GrantController: role grants ----------------

export const listRbacUserRoleGrants = async (
    userId: string,
): Promise<RbacRoleGrantView[]> =>
    restRequest<RbacRoleGrantView[]>({
        method: "GET",
        url: `/identity/users/${userId}/roles`,
    })

export const grantRbacRoleToUser = async (
    userId: string,
    request: RbacGrantRoleRequest,
): Promise<RbacGrantCreatedResponse> =>
    restRequest<RbacGrantCreatedResponse>({
        method: "POST",
        url: `/identity/users/${userId}/roles`,
        data: request,
    })

export const revokeRbacUserRoleGrant = async (
    userId: string,
    grantId: string,
): Promise<RbacMessageResponseStub> =>
    restRequest<RbacMessageResponseStub>({
        method: "DELETE",
        url: `/identity/users/${userId}/roles/${grantId}`,
    })

// ---------------- GrantController: permission grants ----------------

export const listRbacUserPermissionGrants = async (
    userId: string,
): Promise<RbacPermissionGrantView[]> =>
    restRequest<RbacPermissionGrantView[]>({
        method: "GET",
        url: `/identity/users/${userId}/permissions`,
    })

export const grantRbacPermissionToUser = async (
    userId: string,
    request: RbacGrantPermissionRequest,
): Promise<RbacGrantCreatedResponse> =>
    restRequest<RbacGrantCreatedResponse>({
        method: "POST",
        url: `/identity/users/${userId}/permissions`,
        data: request,
    })

export const revokeRbacUserPermissionGrant = async (
    userId: string,
    grantId: string,
): Promise<RbacMessageResponseStub> =>
    restRequest<RbacMessageResponseStub>({
        method: "DELETE",
        url: `/identity/users/${userId}/permissions/${grantId}`,
    })

// ---------------- MePermissionsController ----------------

export const getMyRbacPermissions = async (): Promise<RbacMePermissionsResponse> =>
    restRequest<RbacMePermissionsResponse>({
        method: "GET",
        url: "/identity/me/permissions",
    })

export const checkMyRbacPermissions = async (
    request: RbacCheckRequest,
): Promise<RbacCheckResponse> =>
    restRequest<RbacCheckResponse>({
        method: "POST",
        url: "/identity/permissions/check",
        data: request,
    })
