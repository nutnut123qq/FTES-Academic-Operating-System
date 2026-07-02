"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
    APPEARANCE_STORAGE_KEY,
    DEFAULT_ACCENT,
} from "@/resources/constants/appearance"
import type {
    AccentId,
    EffectDirection,
} from "@/resources/constants/appearance"

/** Appearance store shape: persisted preferences + their setters. */
interface AppearanceState {
    /** Selected accent preset (drives the `data-accent` attribute on `<html>`). */
    accent: AccentId
    /** Whether the ambient background effect renders at all. */
    effectEnabled: boolean
    /** Ambient effect direction: embers rising vs meteors falling. */
    effectDirection: EffectDirection
    /** Select an accent preset (also syncs `data-accent` on `<html>` immediately). */
    setAccent: (accent: AccentId) => void
    /** Toggle the ambient background effect. */
    setEffectEnabled: (enabled: boolean) => void
    /** Pick the ambient effect direction. */
    setEffectDirection: (direction: EffectDirection) => void
}

/** Persisted defaults — indigo #3F51B5, effect ON, falling like meteors. */
const initialState = {
    accent: DEFAULT_ACCENT,
    effectEnabled: true,
    effectDirection: "fall" as EffectDirection,
}

/**
 * Mirror the accent selection onto `<html data-accent="…">` so the matching CSS
 * block in `globals.css` takes over `--accent`/`--accent-foreground`. No-op on
 * the server; the pre-paint inline script in the locale root layout handles the
 * very first paint before hydration.
 * @param accent - the accent preset id to apply.
 */
const applyAccentAttribute = (accent: AccentId) => {
    if (typeof document === "undefined") return
    document.documentElement.dataset.accent = accent
}

/**
 * Appearance preferences (accent color + ambient background effect), persisted to
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
        (set) => ({
            ...initialState,
            setAccent: (accent) => {
                applyAccentAttribute(accent)
                set({ accent })
            },
            setEffectEnabled: (effectEnabled) => set({ effectEnabled }),
            setEffectDirection: (effectDirection) => set({ effectDirection }),
        }),
        {
            name: APPEARANCE_STORAGE_KEY,
            skipHydration: true,
            onRehydrateStorage: () => (state) => {
                // re-assert the attribute after hydration in case the pre-paint
                // script was skipped (e.g. blocked inline scripts)
                if (state) applyAccentAttribute(state.accent)
            },
        },
    ),
)
