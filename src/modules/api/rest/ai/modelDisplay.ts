import type { AiCatalogModel } from "./types"

/**
 * True for an OpenRouter free-tier model — the quota-limited ones that can run
 * out and trigger a fallback. Prefers the explicit `free` flag from newer
 * ai-service builds; falls back to the `:free` id suffix / zero pricing so it
 * still works against an older catalog that omits the flag.
 */
export const isFreeModel = (model: AiCatalogModel): boolean =>
    model.free === true
    || model.id.endsWith(":free")
    || (model.pricing_hint?.prompt_per_1k === 0
        && model.pricing_hint?.completion_per_1k === 0)

/** True when a model reports itself unusable (`status === "down"`). */
export const isModelDown = (model: AiCatalogModel): boolean =>
    model.status === "down"

/**
 * True when a model is spend-gated and must be unlocked before use. Prefers the BE `locked`
 * per-user flag, but also treats any `minSpendVnd > 0` as locked because that flag is unreliable
 * in the current ai-service build — picking such a model otherwise 403s with AI_MODEL_LOCKED.
 */
export const isModelLocked = (model: AiCatalogModel): boolean =>
    model.locked === true || (model.minSpendVnd ?? 0) > 0
