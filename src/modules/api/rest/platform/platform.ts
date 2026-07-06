import { restRequest } from "@/modules/api/rest/client"
import type {
    PlatformAiProvider,
    PlatformAiProviderRequest,
    PlatformCompleteFileUploadRequest,
    PlatformConfiguration,
    PlatformConfigurationRequest,
    PlatformFeatureFlag,
    PlatformFeatureFlagEvaluation,
    PlatformFeatureFlagRequest,
    PlatformFileObject,
    PlatformFileView,
    PlatformJobTriggerResult,
    PlatformPresignUploadRequest,
    PlatformPresignUploadResult,
    PlatformScheduledJob,
} from "./types"

// ---------------- PlatformInfraController: Files ----------------

export const presignPlatformFileUpload = async (
    request: PlatformPresignUploadRequest,
): Promise<PlatformPresignUploadResult> =>
    restRequest<PlatformPresignUploadResult>({
        method: "POST",
        url: "/platform/files/presign-upload",
        data: request,
    })

export const completePlatformFileUpload = async (
    fileId: string,
    request: PlatformCompleteFileUploadRequest,
): Promise<PlatformFileObject> =>
    restRequest<PlatformFileObject>({
        method: "POST",
        url: `/platform/files/${fileId}/complete`,
        data: request,
    })

export const getPlatformFile = async (fileId: string): Promise<PlatformFileView> =>
    restRequest<PlatformFileView>({
        method: "GET",
        url: `/platform/files/${fileId}`,
        authenticated: true,
    })

export const deletePlatformFile = async (fileId: string): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/platform/files/${fileId}`,
    })

// ---------------- PlatformInfraController: Feature flags ----------------

export const listPlatformFeatureFlags = async (): Promise<
    PlatformFeatureFlag[]
> =>
    restRequest<PlatformFeatureFlag[]>({
        method: "GET",
        url: "/platform/feature-flags",
        authenticated: true,
    })

export const evaluatePlatformFeatureFlag = async (
    key: string,
): Promise<PlatformFeatureFlagEvaluation> =>
    restRequest<PlatformFeatureFlagEvaluation>({
        method: "GET",
        url: `/platform/feature-flags/${key}`,
        authenticated: true,
    })

export const updatePlatformFeatureFlag = async (
    key: string,
    request: PlatformFeatureFlagRequest,
): Promise<PlatformFeatureFlag> =>
    restRequest<PlatformFeatureFlag>({
        method: "PUT",
        url: `/platform/feature-flags/${key}`,
        data: request,
    })

// ---------------- PlatformInfraController: Configurations ----------------

export const listPlatformConfigurations = async (request?: {
    scopeType?: string
    scopeId?: string
    prefix?: string
}): Promise<PlatformConfiguration[]> =>
    restRequest<PlatformConfiguration[]>({
        method: "GET",
        url: "/platform/configurations",
        params: {
            scopeType: request?.scopeType,
            scopeId: request?.scopeId,
            prefix: request?.prefix,
        },
        authenticated: true,
    })

export const updatePlatformConfiguration = async (
    key: string,
    request: PlatformConfigurationRequest,
): Promise<PlatformConfiguration> =>
    restRequest<PlatformConfiguration>({
        method: "PUT",
        url: `/platform/configurations/${key}`,
        data: request,
    })

// ---------------- PlatformOpsController: AI providers ----------------

export const listPlatformAiProviders = async (): Promise<
    PlatformAiProvider[]
> =>
    restRequest<PlatformAiProvider[]>({
        method: "GET",
        url: "/platform/ai/providers",
        authenticated: true,
    })

export const updatePlatformAiProvider = async (
    id: string,
    request: PlatformAiProviderRequest,
): Promise<PlatformAiProvider> =>
    restRequest<PlatformAiProvider>({
        method: "PUT",
        url: `/platform/ai/providers/${id}`,
        data: request,
    })

// ---------------- PlatformOpsController: Audit logs ----------------

export const queryPlatformAuditLogs = async (request?: {
    actorId?: string
    resourceType?: string
    resourceId?: string
    action?: string
    from?: string
    to?: string
    page?: number
}): Promise<Record<string, unknown>[]> =>
    restRequest<Record<string, unknown>[]>({
        method: "GET",
        url: "/platform/audit-logs",
        params: {
            actorId: request?.actorId,
            resourceType: request?.resourceType,
            resourceId: request?.resourceId,
            action: request?.action,
            from: request?.from,
            to: request?.to,
            page: request?.page,
        },
        authenticated: true,
    })

// ---------------- PlatformOpsController: Scheduled jobs ----------------

export const listPlatformScheduledJobs = async (): Promise<
    PlatformScheduledJob[]
> =>
    restRequest<PlatformScheduledJob[]>({
        method: "GET",
        url: "/platform/jobs",
        authenticated: true,
    })

export const triggerPlatformScheduledJob = async (
    jobKey: string,
): Promise<PlatformJobTriggerResult> =>
    restRequest<PlatformJobTriggerResult>({
        method: "POST",
        url: `/platform/jobs/${jobKey}/trigger`,
    })

export const listPlatformJobRuns = async (
    jobKey: string,
    page?: number,
): Promise<Record<string, unknown>[]> =>
    restRequest<Record<string, unknown>[]>({
        method: "GET",
        url: `/platform/jobs/${jobKey}/runs`,
        params: {
            page,
        },
        authenticated: true,
    })
