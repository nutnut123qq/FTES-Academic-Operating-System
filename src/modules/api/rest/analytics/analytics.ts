import { createRestAxiosInstance } from "@/modules/api/rest/client"
import { restRequest } from "@/modules/api/rest/client"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import type {
    AnalyticsDashboard,
    AnalyticsExportDownload,
    AnalyticsExportRequest,
    AnalyticsExportResult,
    AnalyticsExportStatus,
} from "./types"

// ---------------- DashboardController ----------------

export const listAnalyticsDashboards = async (): Promise<string[]> =>
    restRequest<string[]>({
        method: "GET",
        url: "/analytics/dashboards",
        authenticated: true,
    })

export const getAnalyticsDashboard = async (
    domain: string,
    params?: {
        from?: string
        to?: string
        granularity?: string
        userId?: string
        subjectId?: string
    },
): Promise<AnalyticsDashboard> =>
    restRequest<AnalyticsDashboard>({
        method: "GET",
        url: `/analytics/dashboards/${domain}`,
        params: { ...params },
        authenticated: true,
    })

// ---------------- ExportController ----------------

const attachBearerToken = (axiosInstance: ReturnType<typeof createRestAxiosInstance>) => {
    const accessToken = LocalStorage.getItemAsString(LocalStorageId.KeycloakAccessToken)
    if (accessToken) {
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    }
}

export const requestAnalyticsExport = async (
    request: AnalyticsExportRequest,
): Promise<AnalyticsExportResult> => {
    const axiosInstance = createRestAxiosInstance()
    attachBearerToken(axiosInstance)

    const response = await axiosInstance.post<unknown>("/analytics/exports", request, {
        headers: { "Content-Type": "application/json" },
    })

    const contentType = response.headers["content-type"] as string | undefined
    if (contentType?.includes("text/csv")) {
        return { kind: "csv", csv: response.data as string }
    }

    const envelope = response.data as { code: number; data?: { jobId?: string } }
    if (envelope.code !== 202) {
        throw new Error("Analytics export request failed")
    }

    const jobId = envelope.data?.jobId
    if (!jobId) {
        throw new Error("Analytics export accepted but no jobId returned")
    }

    return { kind: "job", jobId }
}

export const getAnalyticsExportStatus = async (
    jobId: string,
): Promise<AnalyticsExportStatus> =>
    restRequest<AnalyticsExportStatus>({
        method: "GET",
        url: `/analytics/exports/${jobId}`,
        authenticated: true,
    })

export const downloadAnalyticsExport = async (
    params: AnalyticsExportDownload,
): Promise<ArrayBuffer> => {
    const axiosInstance = createRestAxiosInstance()
    attachBearerToken(axiosInstance)

    const response = await axiosInstance.get<ArrayBuffer>(
        `/analytics/exports/download/${params.storageKey}`,
        {
            params: { token: params.token },
            responseType: "arraybuffer",
        },
    )

    return response.data
}
