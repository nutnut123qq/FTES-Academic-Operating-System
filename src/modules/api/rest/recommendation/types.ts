/**
 * Request/response DTOs for the recommendation REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.recommendation.web.RecommendationController`,
 * `vn.ftes.aos.recommendation.web.PersonalizeController`,
 * `vn.ftes.aos.recommendation.web.dto.RecommendationViews`, and
 * `vn.ftes.aos.recommendation.api.PersonalizeContextApi`.
 *
 * All exported names are prefixed with `Recommendation` to avoid collisions in the
 * shared `src/modules/api/rest/index.ts` barrel.
 */

// ---------------- RecommendationController ----------------

export interface RecommendationDisplaySnapshot {
    title?: string
    thumbnail?: string
    slug?: string
}

export interface RecommendationItem {
    id?: string
    recType: string
    itemType: string
    itemId: string
    score: number
    reasons: Record<string, unknown>[]
    snapshot?: RecommendationDisplaySnapshot
}

export interface RecommendationFeedbackRequest {
    action: string
}

// ---------------- PersonalizeController ----------------

export interface RecommendationContextItem {
    itemType: string
    itemId: string
    score: number
    interactionCount: number
}

export interface RecommendationPersonalizeContext {
    contextVersion: number
    generatedAt: string
    userId: string
    items: RecommendationContextItem[]
    signalCount: number
    consentGiven: boolean
}

export interface RecommendationSignalRow {
    signalType: string
    itemType: string
    itemId: string
    weight: number
    occurredAt: string
}

export interface RecommendationSignalPage {
    items: RecommendationSignalRow[]
    nextCursor?: string
}

export interface RecommendationConsentRequest {
    personalizeEnabled: boolean
    exportEnabled: boolean
}

export interface RecommendationConsentView {
    personalizeEnabled: boolean
    exportEnabled: boolean
}

export interface RecommendationExportRequest {
    scope: string
    fromTs: string
    toTs: string
}

export interface RecommendationExportView {
    id: string
    scope: string
    status: string
    rowCount?: number
    storageKey?: string
}

export interface RecommendationExportDownloadView {
    id: string
    downloadUrl: string
}
