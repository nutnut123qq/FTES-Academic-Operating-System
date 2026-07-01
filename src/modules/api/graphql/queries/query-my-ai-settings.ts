import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyAiSettingsResponse } from "./types"

/** Which AI lane a user runs on (mirrors backend `AiMode`). */
export enum AiMode {
    Auto = "auto",
    Premium = "premium",
    Byok = "byok",
}

/** BYOK provider (mirrors backend `ModelProvider`). */
export enum ModelProvider {
    Gemini = "gemini",
    OpenAI = "openai",
}

/** Paid subscription tier (mirrors backend `AiSubTier`). */
export enum AiSubTier {
    Plus = "plus",
    Pro = "pro",
    Max = "max",
}

const query1 = gql`
  query MyAiSettings {
    myAiSettings {
      success
      message
      error
      data {
        preferredMode
        effectiveMode
        canPremium
        canByok
        byokProvider
        hasByokKey
        byokKeyLast4
        tier
      }
    }
  }
`

export enum QueryMyAiSettings {
    Query1 = "query1",
}

const queryMap: Record<QueryMyAiSettings, DocumentNode> = {
    [QueryMyAiSettings.Query1]: query1,
}

/**
 * Fetches the current user's AI lane settings (preferred + effective lane,
 * BYOK provider/availability, Premium/BYOK capability flags).
 *
 * Mirrors `myAiSettings` (queries/ai/my-ai-settings.resolver.ts).
 */
export const queryMyAiSettings = async ({
    query = QueryMyAiSettings.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyAiSettings, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyAiSettingsResponse>({
        query: queryMap[query],
    })
}
