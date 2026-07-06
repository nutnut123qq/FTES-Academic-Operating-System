/**
 * Request/response DTOs for the identity RBAC REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.identity.rbac.web.RoleController`,
 * `vn.ftes.aos.identity.rbac.web.PermissionCatalogController`,
 * `vn.ftes.aos.identity.rbac.web.GrantController`,
 * `vn.ftes.aos.identity.rbac.web.MePermissionsController`, and the DTOs in
 * `vn.ftes.aos.identity.rbac.web.dto.RbacDtos`.
 *
 * All exported names are prefixed with `Rbac` to avoid collisions in the
 * shared `src/modules/api/rest/index.ts` barrel.
 */

// ---------------- RoleController ----------------

export interface RbacRoleView {
    id: string
    code: string
    name: string
    description?: string
    system: boolean
    allowedScopeTypes: string[]
    permissionCodes: string[]
    grantCount: number
}

export interface RbacRoleSummary {
    id: string
    code: string
    name: string
    system: boolean
    allowedScopeTypes: string[]
    grantCount: number
}

export interface RbacCreateRoleRequest {
    code: string
    name: string
    description?: string
    allowedScopeTypes: string[]
    permissionCodes?: string[]
}

export interface RbacUpdateRoleRequest {
    name?: string
    description?: string
    allowedScopeTypes?: string[]
}

export interface RbacReplacePermissionsRequest {
    permissionCodes: string[]
}

// ---------------- PermissionCatalogController ----------------

export interface RbacPermissionView {
    code: string
    domain: string
    description?: string
}

export interface RbacPermissionDomainGroup {
    domain: string
    permissions: RbacPermissionView[]
}

// ---------------- GrantController ----------------

export interface RbacGrantRoleRequest {
    roleCode: string
    scopeType: string
    scopeId?: string
    expiresAt?: string
}

export interface RbacGrantPermissionRequest {
    permissionCode: string
    scopeType: string
    scopeId?: string
    expiresAt?: string
}

export interface RbacRoleGrantView {
    grantId: string
    roleCode: string
    scopeType: string
    scopeId?: string
    grantedBy: string
    grantedAt: string
    expiresAt?: string
}

export interface RbacPermissionGrantView {
    grantId: string
    permissionCode: string
    scopeType: string
    scopeId?: string
    grantedBy: string
    grantedAt: string
    expiresAt?: string
}

export interface RbacGrantCreatedResponse {
    grantId: string
}

// ---------------- MePermissionsController ----------------

export interface RbacMeRoleView {
    code: string
    scopeType: string
    scopeId?: string
}

export interface RbacMePermissionScope {
    scopeType: string
    scopeId?: string
}

export interface RbacMePermissionView {
    code: string
    domain: string
    scopes: RbacMePermissionScope[]
}

export interface RbacMePermissionsResponse {
    superAdmin: boolean
    roles: RbacMeRoleView[]
    permissions: RbacMePermissionView[]
}

export interface RbacCheckItem {
    permission: string
    scopeType?: string
    scopeId?: string
}

export interface RbacCheckRequest {
    checks: RbacCheckItem[]
}

export interface RbacCheckResult {
    permission: string
    scopeType?: string
    scopeId?: string
    allowed: boolean
}

export interface RbacCheckResponse {
    results: RbacCheckResult[]
}

// ---------------- Generic ack ----------------

export interface RbacMessageResponseStub {
    status: string
}
