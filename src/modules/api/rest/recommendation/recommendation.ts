import { createRestAxiosInstance, restRequest } from "@/modules/api/rest/client"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import type {
    RecommendationConsentRequest,
    RecommendationConsentView,
    RecommendationExportDownloadView,
    RecommendationExportRequest,
    RecommendationExportView,
    RecommendationFeedbackRequest,
    RecommendationItem,
    RecommendationPersonalizeContext,
    RecommendationSignalPage,
} from "./types"

// ---------------- RecommendationController ----------------

export const getRecommendations = async (request: {
    type: string
    limit?: number
}): Promise<RecommendationItem[]> =>
    restRequest<RecommendationItem[]>({
        method: "GET",
        url: "/recommendations",
        params: {
            type: request.type,
            limit: request.limit,
        },
        authenticated: true,
    })

export const submitRecommendationFeedback = async (
    id: string,
    request: RecommendationFeedbackRequest,
): Promise<void> =>
    restRequest<void>({
        method: "POST",
        url: `/recommendations/${id}/feedback`,
        data: request,
    })

// ---------------- PersonalizeController ----------------

export const getMyPersonalizeContext = async (request?: {
    limit?: number
}): Promise<RecommendationPersonalizeContext> =>
    restRequest<RecommendationPersonalizeContext>({
        method: "GET",
        url: "/personalize/context/me",
        params: {
            limit: request?.limit,
        },
        authenticated: true,
    })

export const getPersonalizeContextOf = async (
    userId: string,
    request?: {
        limit?: number
    },
): Promise<RecommendationPersonalizeContext> =>
    restRequest<RecommendationPersonalizeContext>({
        method: "GET",
        url: `/personalize/contexts/${userId}`,
        params: {
            limit: request?.limit,
        },
        authenticated: true,
    })

export const getPersonalizeSignals = async (
    userId: string,
    request?: {
        windowType?: string
        signalKey?: string
        cursor?: string
        limit?: number
    },
): Promise<RecommendationSignalPage> =>
    restRequest<RecommendationSignalPage>({
        method: "GET",
        url: `/personalize/signals/${userId}`,
        params: {
            windowType: request?.windowType,
            signalKey: request?.signalKey,
            cursor: request?.cursor,
            limit: request?.limit,
        },
        authenticated: true,
    })

export const getMyPersonalizeConsent = async (): Promise<RecommendationConsentView> =>
    restRequest<RecommendationConsentView>({
        method: "GET",
        url: "/personalize/consent/me",
        authenticated: true,
    })

export const updateMyPersonalizeConsent = async (
    request: RecommendationConsentRequest,
): Promise<RecommendationConsentView> =>
    restRequest<RecommendationConsentView>({
        method: "PUT",
        url: "/personalize/consent/me",
        data: request,
    })

export const requestPersonalizeExport = async (
    request: RecommendationExportRequest,
): Promise<RecommendationExportView> => {
    const axiosInstance = createRestAxiosInstance()
    const accessToken = LocalStorage.getItemAsString(LocalStorageId.KeycloakAccessToken)
    if (accessToken) {
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    }

    const response = await axiosInstance.post<{
        code: number
        message?: string
        data?: RecommendationExportView
    }>("/personalize/exports", request)

    const envelope = response.data
    if (envelope.code !== 1002) {
        throw new Error(envelope.message || "Export request failed")
    }

    const data = envelope.data
    if (!data) {
        throw new Error("Export accepted but no data returned")
    }

    return data
}

export const getPersonalizeExportDownload = async (
    id: string,
): Promise<RecommendationExportDownloadView> =>
    restRequest<RecommendationExportDownloadView>({
        method: "GET",
        url: `/personalize/exports/${id}/download`,
        authenticated: true,
    })
