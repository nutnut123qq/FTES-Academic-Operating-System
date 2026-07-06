/**
 * Request/response DTOs for the platform REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.platform.web.PlatformInfraController`,
 * `vn.ftes.aos.platform.web.PlatformOpsController`, and the domain entities in
 * `vn.ftes.aos.platform.domain`.
 *
 * All exported names are prefixed with `Platform` to avoid collisions in the
 * shared `src/modules/api/rest/index.ts` barrel.
 */

// ---------------- Files ----------------

export interface PlatformFileObject {
    id: string
    bucket: string
    objectKey: string
    ownerId: string
    contentType: string
    sizeBytes: number
    checksumSha256?: string
    status: string
    visibility: string
    cdnUrl?: string
    createdAt: string
    updatedAt: string
}

export interface PlatformFileView {
    id: string
    contentType: string
    sizeBytes: number
    checksumSha256: string
    status: string
    visibility: string
    accessUrl: string
}

export interface PlatformPresignUploadRequest {
    fileName: string
    contentType: string
    sizeBytes: number
    visibility?: string
}

export interface PlatformPresignUploadResult {
    fileId: string
    uploadUrl: string
    objectKey: string
}

export interface PlatformCompleteFileUploadRequest {
    checksumSha256: string
}

// ---------------- Feature flags ----------------

export interface PlatformFeatureFlag {
    flagKey: string
    description?: string
    enabled: boolean
    strategy: string
    rollout?: string
    updatedBy?: string
    createdAt?: string
    updatedAt?: string
}

export interface PlatformFeatureFlagRequest {
    enabled: boolean
    strategy?: string
    rollout?: string
}

export interface PlatformFeatureFlagEvaluation {
    key: string
    enabled: boolean
}

// ---------------- Configurations ----------------

export interface PlatformConfiguration {
    id: string
    scopeType: string
    scopeId?: string
    configKey: string
    value: string
    version: number
    updatedBy?: string
    createdAt?: string
    updatedAt?: string
}

export interface PlatformConfigurationRequest {
    scopeType: string
    scopeId?: string
    value: string
    version: number
}

// ---------------- AI providers ----------------

export interface PlatformAiProvider {
    id: string
    name: string
    providerType: string
    baseUrl: string
    secretEnvName: string
    model: string
    priority: number
    enabled: boolean
    maxRpm?: number
    maxTpm?: number
    createdAt?: string
    updatedAt?: string
}

export interface PlatformAiProviderRequest {
    priority?: number
    enabled?: boolean
}

// ---------------- Scheduled jobs ----------------

export interface PlatformScheduledJob {
    id: string
    jobKey: string
    description?: string
    cronExpression: string
    handlerBean: string
    enabled: boolean
    lastRunAt?: string
    lastStatus?: string
}

export interface PlatformJobTriggerResult {
    jobKey: string
    triggered: boolean
}
