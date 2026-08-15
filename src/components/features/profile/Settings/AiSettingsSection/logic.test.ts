import { describe, expect, it } from "vitest"
import { AiMode, ModelProvider } from "@/modules/api/graphql/queries/query-my-ai-settings"
import { buildAiSettingsRequest, buildClearByokRequest } from "./logic"

/**
 * Unit — the request builder behind the FrosTES settings form.
 *
 * The rule worth pinning: a stored BYOK key belongs to ONE provider, so an empty
 * key field may only be accepted when the provider is unchanged. Getting that
 * wrong silently points the account at a provider it has no key for.
 */

/** Server state with a Gemini key on file. */
const withGeminiKey = { byokProvider: ModelProvider.Gemini, hasByokKey: true }

/** Server state with nothing stored. */
const withNoKey = { byokProvider: null, hasByokKey: false }

describe("buildAiSettingsRequest", () => {
    it("sends only the lane for auto/premium, leaving any stored key alone", () => {
        const result = buildAiSettingsRequest(
            { mode: AiMode.Premium, byokProvider: ModelProvider.OpenAI, byokApiKey: "sk-typed" },
            withGeminiKey,
        )
        expect(result).toEqual({ ok: true, request: { mode: AiMode.Premium } })
    })

    it("sends a typed key together with its provider", () => {
        const result = buildAiSettingsRequest(
            { mode: AiMode.Byok, byokProvider: ModelProvider.OpenAI, byokApiKey: "  sk-typed  " },
            withNoKey,
        )
        expect(result).toEqual({
            ok: true,
            request: {
                mode: AiMode.Byok,
                byokProvider: ModelProvider.OpenAI,
                byokApiKey: "sk-typed",
            },
        })
    })

    it("accepts a blank key field when the stored key's provider is unchanged", () => {
        const result = buildAiSettingsRequest(
            { mode: AiMode.Byok, byokProvider: ModelProvider.Gemini, byokApiKey: "" },
            withGeminiKey,
        )
        expect(result).toEqual({ ok: true, request: { mode: AiMode.Byok } })
    })

    it("refuses a blank key field when the provider changed", () => {
        const result = buildAiSettingsRequest(
            { mode: AiMode.Byok, byokProvider: ModelProvider.OpenAI, byokApiKey: "" },
            withGeminiKey,
        )
        expect(result).toEqual({ ok: false, reason: "byokKeyRequired" })
    })

    it("refuses BYOK with no key typed and none stored", () => {
        const result = buildAiSettingsRequest(
            { mode: AiMode.Byok, byokProvider: ModelProvider.Gemini, byokApiKey: "   " },
            withNoKey,
        )
        expect(result).toEqual({ ok: false, reason: "byokKeyRequired" })
    })
})

describe("buildClearByokRequest", () => {
    it("asks the backend to wipe the stored key", () => {
        expect(buildClearByokRequest()).toEqual({ clearByok: true })
    })
})
