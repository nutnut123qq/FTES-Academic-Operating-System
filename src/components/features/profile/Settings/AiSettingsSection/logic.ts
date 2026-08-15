import { AiMode, ModelProvider } from "@/modules/api/graphql/queries/query-my-ai-settings"
import type { UpdateMyAiSettingsRequest } from "@/modules/api/graphql/mutations/types/update-my-ai-settings"

/** What the form currently holds. */
export interface AiSettingsDraft {
    /** The lane the user picked in the form. */
    mode: AiMode
    /** The BYOK provider the user picked in the form. */
    byokProvider: ModelProvider
    /** Raw contents of the API-key field (may be blank / whitespace). */
    byokApiKey: string
}

/** The server's current view of the user's settings (from `myAiSettings`). */
export interface AiSettingsSaved {
    /** Provider a key is stored FOR; `null` when none is stored. */
    byokProvider: ModelProvider | null
    /** True when an encrypted key already lives server-side. */
    hasByokKey: boolean
}

/** Outcome of {@link buildAiSettingsRequest}. */
export type BuildAiSettingsResult =
    /** The draft is savable — send `request`. */
    | { ok: true, request: UpdateMyAiSettingsRequest }
    /** BYOK was chosen but no usable key exists for the chosen provider. */
    | { ok: false, reason: "byokKeyRequired" }

/**
 * Turn the form state into the `updateMyAiSettings` request, or refuse.
 *
 * The branch that matters is BYOK. The mutation stores a key against a provider,
 * so a key that is already on file is only valid for the provider it was saved
 * for: switching Gemini → OpenAI without typing a new key would leave the account
 * pointing at a provider whose key does not exist, and every AI call would fail
 * with a lane the user believes they configured. So a blank key field is accepted
 * ONLY when a key is already stored AND the provider is unchanged; otherwise the
 * form must ask for one. A typed key always goes up WITH its provider (the
 * backend requires the pair).
 *
 * Non-BYOK lanes never touch the key — they send the lane alone, which leaves any
 * stored key intact for a later switch back (clearing is a separate explicit
 * action, {@link buildClearByokRequest}).
 *
 * @param draft - the form state.
 * @param saved - the server's current settings.
 * @returns the request to send, or the reason the draft cannot be saved.
 */
export const buildAiSettingsRequest = (
    draft: AiSettingsDraft,
    saved: AiSettingsSaved,
): BuildAiSettingsResult => {
    if (draft.mode !== AiMode.Byok) {
        return { ok: true, request: { mode: draft.mode } }
    }

    const key = draft.byokApiKey.trim()
    if (key.length === 0) {
        // reusing the stored key is only safe while the provider stays the same
        if (!saved.hasByokKey || saved.byokProvider !== draft.byokProvider) {
            return { ok: false, reason: "byokKeyRequired" }
        }
        return { ok: true, request: { mode: draft.mode } }
    }

    return {
        ok: true,
        request: {
            mode: draft.mode,
            byokProvider: draft.byokProvider,
            byokApiKey: key,
        },
    }
}

/**
 * The request that wipes the stored BYOK key + provider. Kept next to
 * {@link buildAiSettingsRequest} so both writes to this endpoint are described in
 * one place.
 */
export const buildClearByokRequest = (): UpdateMyAiSettingsRequest => ({ clearByok: true })
