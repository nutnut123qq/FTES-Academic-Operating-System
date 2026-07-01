import type { GraphQLResponse } from "../../types"

/** AI Lab params block (temperature / top-p / max tokens) on a playground default. */
export interface QueryAiLabPlaygroundParamsData {
    /** Sampling temperature default. */
    temperature: number | null
    /** Nucleus sampling top-p default. */
    topP: number | null
    /** Max output tokens default. */
    maxTokens: number | null
}

/** One localized field row for a playground (label / description per locale). */
export interface QueryAiLabPlaygroundTranslationData {
    /** Locale code (e.g. "vi", "en"). */
    locale: string
    /** Which entity field this row localizes. */
    field: string
    /** Localized value. */
    value: string
}

/** Payload inside `aiLabPlayground.data` after the standard API wrapper. */
export interface AiLabPlaygroundData {
    /** Playground id. */
    id: string
    /** Owning content (lesson) id. */
    contentId: string
    /** Stable slug. */
    slug: string
    /** Playground kind (prompt | rag | comparison). */
    kind: string
    /** Seed system prompt. */
    defaultSystemPrompt: string | null
    /** Seed user prompt. */
    defaultUserPrompt: string | null
    /** Seed generation params. */
    defaultParams: QueryAiLabPlaygroundParamsData | null
    /** Providers the playground allows the user to pick from. */
    allowedProviders: Array<string>
    /** Run budget per rate-limit window. */
    maxRunsPerWindow: number
    /** RAG collection slug (rag kind only). */
    ragCollectionSlug: string | null
    /** Default locale for localized fields. */
    defaultLocale: string
    /** Localized label/description rows. */
    translations: Array<QueryAiLabPlaygroundTranslationData>
}

/** Apollo response shape for the `aiLabPlayground` query. */
export interface QueryAiLabPlaygroundResponse {
    /** Top-level `aiLabPlayground` field wrapping the standard API response. */
    aiLabPlayground: GraphQLResponse<AiLabPlaygroundData>
}
