import { restRequest } from "@/modules/api/rest/client"
import type {
    ReindexJobView,
    ReindexRequest,
    SearchRequest,
    SearchResponse,
    SuggestRequest,
    SuggestResponse,
} from "./types"

// ---------------- SearchController ----------------

export const search = async (request: SearchRequest): Promise<SearchResponse> =>
    restRequest<SearchResponse>({
        method: "GET",
        url: "/search",
        params: {
            q: request.q,
            types: request.types?.join(","),
            filters: request.filters ? JSON.stringify(request.filters) : undefined,
            mode: request.mode,
            page: request.page,
            size: request.size,
            nlStrict: request.nlStrict,
        },
        authenticated: true,
    })

export const suggest = async (request: SuggestRequest): Promise<SuggestResponse> =>
    restRequest<SuggestResponse>({
        method: "GET",
        url: "/search/suggest",
        params: {
            q: request.q,
            types: request.types,
            limit: request.limit,
        },
        authenticated: true,
    })

// ---------------- AdminReindexController ----------------

export const reindex = async (request?: ReindexRequest): Promise<ReindexJobView> =>
    restRequest<ReindexJobView>({
        method: "POST",
        url: "/admin/search/reindex",
        data: request?.docType ? { docType: request.docType } : undefined,
    })

export const getReindexJob = async (jobId: string): Promise<ReindexJobView> =>
    restRequest<ReindexJobView>({
        method: "GET",
        url: `/admin/search/reindex/${jobId}`,
        authenticated: true,
    })
