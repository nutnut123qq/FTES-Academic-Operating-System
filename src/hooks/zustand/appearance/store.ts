"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
    accentForeground,
    APPEARANCE_STORAGE_KEY,
    DEFAULT_ACCENT,
    DEFAULT_BACKGROUND_EFFECT,
    DEFAULT_EFFECT_SPEED,
    isAccentHex,
    isBackgroundEffect,
} from "@/resources/constants/appearance"
import type {
    AccentId,
    BackgroundEffect,
    EffectDirection,
    EffectSpeed,
} from "@/resources/constants/appearance"
import { pushAppearance, reconcileAppearance, toServerAccent } from "./sync"
import type { ServerAppearance } from "./sync"

/** Appearance store shape: persisted preferences + their setters. */
interface AppearanceState {
    /** Selected accent preset (drives the `data-accent` attribute on `<html>`). */
    accent: AccentId
    /**
     * Free-form accent picked with the colour picker (`#rrggbb`). When set it WINS
     * over {@link AppearanceState.accent}: it is written as an inline
     * `--accent` / `--accent-foreground` style on `<html>`, which beats the
     * `[data-accent="…"]` CSS block. `null` = use the preset.
     */
    accentCustom: string | null
    /** Ambient background effect (`none` = off). */
    effect: BackgroundEffect
    /** Ambient effect direction — only the `ember` effect reads it. */
    effectDirection: EffectDirection
    /** Ambient effect speed tier — only the `ember` effect reads it. */
    effectSpeed: EffectSpeed
    /** Select an accent preset (clears any custom colour and syncs `<html>`). */
    setAccent: (accent: AccentId) => void
    /** Set (or clear, with `null`) the free-form accent colour. */
    setAccentCustom: (hex: string | null) => void
    /** Back to the default preset with no custom colour. */
    resetAccent: () => void
    /** Pick the ambient background effect. */
    setEffect: (effect: BackgroundEffect) => void
    /** Pick the ambient effect direction. */
    setEffectDirection: (direction: EffectDirection) => void
    /** Pick the ambient effect speed tier. */
    setEffectSpeed: (speed: EffectSpeed) => void
}

/** Persisted defaults — indigo #3F51B5, embers falling like meteors at normal speed. */
const initialState = {
    accent: DEFAULT_ACCENT,
    accentCustom: null,
    effect: DEFAULT_BACKGROUND_EFFECT,
    effectDirection: "fall" as EffectDirection,
    effectSpeed: DEFAULT_EFFECT_SPEED,
}

/**
 * Mirror the accent selection onto `<html>`: the preset id as `data-accent="…"`
 * (the matching block in `globals.css` takes over `--accent`) and, when the user
 * picked a free-form colour, an inline `--accent` / `--accent-foreground` pair
 * that outranks it. No-op on the server; the pre-paint inline script in the
 * locale root layout handles the very first paint before hydration.
 *
 * @param accent - the accent preset id.
 * @param custom - the free-form `#rrggbb` override, or `null` for the preset.
 */
const applyAccent = (accent: AccentId, custom: string | null) => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    root.dataset.accent = accent
    if (custom && isAccentHex(custom)) {
        root.style.setProperty("--accent", custom)
        root.style.setProperty("--accent-foreground", accentForeground(custom))
        return
    }
    root.style.removeProperty("--accent")
    root.style.removeProperty("--accent-foreground")
}

/**
 * Appearance preferences (accent colour + ambient background effect), persisted to
 * localStorage under {@link APPEARANCE_STORAGE_KEY}. Theme mode (light/dark/system)
 * deliberately does NOT live here — next-themes owns it (its own persist key +
 * pre-paint script).
 *
 * `skipHydration` keeps the first client render identical to the server markup
 * (defaults), avoiding hydration mismatches; `InnerLayout` calls
 * `useAppearanceStore.persist.rehydrate()` in an effect right after mount.
 */
export const useAppearanceStore = create<AppearanceState>()(
    persist(
        (set, get) => ({
            ...initialState,
            setAccent: (accent) => {
                // picking a preset drops the custom colour — otherwise the inline
                // override would silently swallow the choice
                applyAccent(accent, null)
                set({ accent, accentCustom: null })
                pushAppearance({ accentColor: accent })
            },
            setAccentCustom: (accentCustom) => {
                applyAccent(get().accent, accentCustom)
                set({ accentCustom })
                // clearing the custom colour falls back to the preset underneath —
                // the account stores ONE accent string, so send whichever now wins
                pushAppearance({ accentColor: toServerAccent(get().accent, accentCustom) })
            },
            resetAccent: () => {
                applyAccent(DEFAULT_ACCENT, null)
                set({ accent: DEFAULT_ACCENT, accentCustom: null })
                pushAppearance({ accentColor: DEFAULT_ACCENT })
            },
            setEffect: (effect) => {
                set({ effect })
                pushAppearance({ backgroundEffect: effect })
            },
            // direction/speed stay device-local: they only steer the `ember` field and
            // the account only carries the two choices the settings page is about
            // (accent + effect).
            setEffectDirection: (effectDirection) => set({ effectDirection }),
            setEffectSpeed: (effectSpeed) => set({ effectSpeed }),
        }),
        {
            name: APPEARANCE_STORAGE_KEY,
            skipHydration: true,
            version: 2,
            /**
             * v1 stored the effect as a boolean switch (`effectEnabled`) over a single
             * spark field; v2 stores the picked effect by name. Map the old flag onto
             * the equivalent named effect so nobody's background silently disappears.
             */
            migrate: (persisted, version) => {
                const state = (persisted ?? {}) as Partial<AppearanceState> & { effectEnabled?: boolean }
                if (version >= 2) return state
                const { effectEnabled, ...rest } = state
                return {
                    ...rest,
                    accentCustom: null,
                    effect: effectEnabled === false ? "none" : DEFAULT_BACKGROUND_EFFECT,
                }
            },
            onRehydrateStorage: () => (state) => {
                if (!state) return
                // drop values an older/newer build (or a hand-edited storage entry)
                // may have left behind, then re-assert the attribute in case the
                // pre-paint script was skipped (e.g. blocked inline scripts)
                if (!isBackgroundEffect(state.effect)) {
                    state.effect = DEFAULT_BACKGROUND_EFFECT
                }
                if (!isAccentHex(state.accentCustom)) {
                    state.accentCustom = null
                }
                applyAccent(state.accent, state.accentCustom)
            },
        },
    ),
)

/**
 * Apply the signed-in account's saved appearance (`GET /profiles/me` →
 * `accentColor` / `backgroundEffect`) on top of what this browser remembered.
 * Called once per viewer load; a guest never reaches it, so guests keep the
 * pure-localStorage behaviour.
 *
 * Two things this deliberately does NOT do:
 * - it does not push back. The write goes through `useAppearanceStore.setState`,
 *   not through the setters, so applying the server value cannot echo a PATCH of
 *   the value that just came from the server.
 * - it does not skip the rehydrate. The store persists with `skipHydration`, so
 *   without awaiting it here a fast viewer response could be applied first and
 *   then overwritten by the localStorage rehydrate landing after it.
 *
 * The result is written back through `persist`, which keeps localStorage in sync
 * with the account — that cache is what the pre-paint script in the locale layout
 * reads, so the next page load paints the account's accent with no flash.
 *
 * @param server - the appearance fields off the self profile, or `null` for none.
 */
export const hydrateAppearanceFromServer = async (
    server: ServerAppearance | null | undefined,
): Promise<void> => {
    await useAppearanceStore.persist.rehydrate()
    const state = useAppearanceStore.getState()
    const next = reconcileAppearance(server, {
        accent: state.accent,
        accentCustom: state.accentCustom,
        effect: state.effect,
    })
    if (
        next.accent === state.accent
        && next.accentCustom === state.accentCustom
        && next.effect === state.effect
    ) {
        return
    }
    applyAccent(next.accent, next.accentCustom)
    useAppearanceStore.setState(next)
}
