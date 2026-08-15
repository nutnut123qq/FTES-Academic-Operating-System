import { updateSelfProfile } from "@/modules/api/rest/profile"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import {
    isAccentHex,
    isAccentId,
    isBackgroundEffect,
} from "@/resources/constants/appearance"
import type { AccentId, BackgroundEffect } from "@/resources/constants/appearance"

/**
 * The two appearance choices as the BE stores them on the profile
 * (`GET /api/v1/profiles/me` → `accentColor` / `backgroundEffect`). Both are
 * nullable: `null` means the account has NEVER picked one, which is what makes
 * "the account has no opinion" distinguishable from "the account deliberately
 * picked the default" — without that distinction a fresh row would wipe the
 * choice already sitting in this browser's localStorage.
 */
export interface ServerAppearance {
    /** Accent preset id (`"indigo"`) OR a free-form hex (`"#3f51b5"`); `null` = never chosen. */
    accentColor: string | null
    /** Ambient background effect name (`"none"` = off); `null` = never chosen. */
    backgroundEffect: string | null
}

/** The appearance slice of the local (localStorage-backed) store. */
export interface LocalAppearance {
    /** Selected accent preset. */
    accent: AccentId
    /** Free-form accent hex that outranks the preset, or `null`. */
    accentCustom: string | null
    /** Ambient background effect. */
    effect: BackgroundEffect
}

/**
 * Decide which appearance actually applies, given what the account carries and
 * what this browser remembered.
 *
 * The rule is "server wins WHEN IT HAS A VALUE", per field:
 * - signed-out (`server === null`) → the local values, unchanged;
 * - a field the account never set (`null`) or that this build cannot render
 *   (an unknown effect name, a malformed colour — the value is user-supplied and
 *   travels through several versions of the app) → fall back to local rather than
 *   to the hard default, otherwise logging in on a new device would silently
 *   reset the look this browser has been showing;
 * - a preset id clears any local custom colour (they are mutually exclusive: the
 *   inline `--accent` would otherwise swallow the preset the account chose);
 * - a hex keeps the local preset id underneath, since the account only stores the
 *   one colour and the preset is what the picker falls back to on reset.
 *
 * Pure on purpose — this is the only branchy part of the feature, so it is the
 * part worth testing without a store, a network or a DOM.
 *
 * @param server - the account's stored choices, or `null` for a guest.
 * @param local - what the localStorage-backed store currently holds.
 * @returns the appearance to apply.
 */
export const reconcileAppearance = (
    server: ServerAppearance | null | undefined,
    local: LocalAppearance,
): LocalAppearance => {
    if (!server) return local
    const accentPart: Pick<LocalAppearance, "accent" | "accentCustom"> = isAccentId(server.accentColor)
        ? { accent: server.accentColor, accentCustom: null }
        : isAccentHex(server.accentColor)
            ? { accent: local.accent, accentCustom: server.accentColor }
            : { accent: local.accent, accentCustom: local.accentCustom }
    return {
        ...accentPart,
        effect: isBackgroundEffect(server.backgroundEffect) ? server.backgroundEffect : local.effect,
    }
}

/**
 * The single string the BE stores for the accent: the free-form colour when the
 * user picked one, otherwise the preset id.
 *
 * @param accent - the selected preset id.
 * @param accentCustom - the free-form hex, or `null`.
 * @returns the value to send as `accentColor`.
 */
export const toServerAccent = (accent: AccentId, accentCustom: string | null): string =>
    accentCustom !== null && isAccentHex(accentCustom) ? accentCustom : accent

/**
 * How long to coalesce appearance writes before hitting the network. Clicking
 * through the ten effect tiles to see which one you like is one intent, not ten
 * PATCHes; the accent picker already debounces its own drag before it even
 * reaches the store.
 */
const PUSH_DEBOUNCE_MS = 600

/** Pending (coalesced) fields waiting for the debounce to fire. */
let pending: Partial<ServerAppearance> = {}

/** Handle of the pending debounce, so a newer change replaces the older one. */
let pushTimer: ReturnType<typeof setTimeout> | undefined

/** Whether there is a signed-in session to write to (guests stay localStorage-only). */
const isSignedIn = (): boolean => {
    if (typeof window === "undefined") return false
    try {
        return Boolean(LocalStorage.getItemAsString(LocalStorageId.KeycloakAccessToken))
    } catch {
        return false
    }
}

/**
 * Persist an appearance change onto the signed-in account (`PATCH /profiles/me`,
 * partial update — only the fields passed here are sent).
 *
 * No-ops for guests: their choice lives in localStorage exactly as before, and
 * firing an unauthenticated PATCH would just 401 on every swatch click. Failures
 * are swallowed on purpose — the choice is already applied and persisted locally,
 * so a sync error must not surface as an error toast over a colour picker.
 *
 * @param patch - the field(s) that changed.
 */
export const pushAppearance = (patch: Partial<ServerAppearance>): void => {
    if (!isSignedIn()) return
    pending = { ...pending, ...patch }
    clearTimeout(pushTimer)
    pushTimer = setTimeout(() => {
        const body = pending
        pending = {}
        void updateSelfProfile(body).catch(() => undefined)
    }, PUSH_DEBOUNCE_MS)
}
