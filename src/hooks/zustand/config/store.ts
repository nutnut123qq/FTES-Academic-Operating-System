"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
    CONFIG_STORAGE_KEY,
    SEED_FLAGS,
    SEED_GROUPS,
} from "@/resources/constants/config"
import type {
    ConfigCategory,
    ConfigScope,
    FeatureFlag,
    SettingCategory,
    SettingGroup,
} from "@/resources/constants/config"

/** Async status of the mock config backend. */
type ConfigStatus = "idle" | "loading" | "error"

/** Config Center store shape: the persisted mock DB + UI session fields. */
interface ConfigState {
    /** All feature flags (mock DB — written only through `configService`). */
    flags: Array<FeatureFlag>
    /** Setting group per category (mock DB — written only through `configService`). */
    groups: Record<SettingCategory, SettingGroup>
    /** Selected scope; only `"global"` carries real data (per-env deferred). */
    scope: ConfigScope
    /** Last mock-backend op status. */
    status: ConfigStatus
    /** Category whose form holds unsaved edits (drives the dirty-guard); null = clean. */
    dirtyCategory: ConfigCategory | null
    /** Replace one flag (matched by key). */
    setFlag: (flag: FeatureFlag) => void
    /** Replace one setting group. */
    setGroup: (group: SettingGroup) => void
    /** Select the scope. */
    setScope: (scope: ConfigScope) => void
    /** Set the mock-backend status. */
    setStatus: (status: ConfigStatus) => void
    /** Mark/clear the dirty category. */
    setDirtyCategory: (category: ConfigCategory | null) => void
}

/** Defaults — the seed constants act as the first-run mock DB. */
const initialState = {
    flags: [...SEED_FLAGS],
    groups: { ...SEED_GROUPS },
    scope: "global" as ConfigScope,
    status: "idle" as ConfigStatus,
    dirtyCategory: null,
}

/**
 * Config Center mock persistence (flags + setting groups + scope), persisted to
 * localStorage under {@link CONFIG_STORAGE_KEY}. This store is the mock DB behind
 * `configService` — components never write it directly; reads flow through the
 * SWR-shaped feature hooks so the BE swap only touches the service.
 *
 * `skipHydration` keeps the first client render identical to the server markup;
 * `ConfigCenter` rehydrates in an effect right after mount (same pattern as the
 * appearance store).
 */
export const useConfigStore = create<ConfigState>()(
    persist(
        (set) => ({
            ...initialState,
            setFlag: (flag) =>
                set((state) => ({
                    flags: state.flags.map((f) => (f.key === flag.key ? flag : f)),
                })),
            setGroup: (group) =>
                set((state) => ({
                    groups: { ...state.groups, [group.id]: group },
                })),
            setScope: (scope) => set({ scope }),
            setStatus: (status) => set({ status }),
            setDirtyCategory: (dirtyCategory) => set({ dirtyCategory }),
        }),
        {
            name: CONFIG_STORAGE_KEY,
            skipHydration: true,
            // only the mock DB persists; status/dirty are per-session UI state
            partialize: (state) => ({
                flags: state.flags,
                groups: state.groups,
                scope: state.scope,
            }),
        },
    ),
)
