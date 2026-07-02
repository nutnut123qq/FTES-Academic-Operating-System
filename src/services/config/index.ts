"use client"

import { CONFIG_AUDIT_YOU } from "@/resources/constants/config"
import type {
    ConfigScope,
    FeatureFlag,
    SettingCategory,
    SettingGroup,
    SettingValue,
} from "@/resources/constants/config"
import { useConfigStore } from "@/hooks/zustand/config"

/**
 * The Config Center I/O seam — every read/write of flags/settings goes through
 * this interface, so swapping the mock for the real BE config-service changes
 * exactly one implementation.
 *
 * ponytail: BE swap point. Replace `mockConfigService` with an `httpConfigService`
 * calling the (ASSUMED, not-yet-existing) config-service REST contract:
 *   GET   /config/flags?scope=…          → Array<FeatureFlag>
 *   PATCH /config/flags/:key             → FeatureFlag
 *   GET   /config/:category?scope=…      → SettingGroup
 *   PUT   /config/:category              → SettingGroup
 * with the house envelope `{ data, success, error }` where `data` is nullable
 * (unwrap + throw on !success). UI + hooks stay untouched.
 */
export interface ConfigService {
    /** List all feature flags of a scope. */
    listFlags: (scope: ConfigScope) => Promise<Array<FeatureFlag>>
    /** Patch one flag's status/rollout; returns the updated flag. */
    setFlag: (
        key: string,
        patch: Partial<Pick<FeatureFlag, "status" | "rolloutPercent">>,
    ) => Promise<FeatureFlag>
    /** Load one category's setting group for a scope. */
    getGroup: (category: SettingCategory, scope: ConfigScope) => Promise<SettingGroup>
    /** Save a category's values; returns the updated group with a fresh audit note. */
    saveGroup: (
        category: SettingCategory,
        values: Record<string, SettingValue>,
    ) => Promise<SettingGroup>
}

/**
 * Dev knobs for the mock backend — flip from the browser console
 * (`window.__ftesConfigMock.failNextSave = true`) to exercise the error states.
 */
export const mockConfigControls = {
    /** Next listFlags/getGroup rejects once. */
    failNextLoad: false,
    /** Next setFlag/saveGroup rejects once. */
    failNextSave: false,
}

if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).__ftesConfigMock = mockConfigControls
}

/** Simulated network latency of the mock backend (ms). */
const MOCK_LATENCY_MS = 350

/** Resolve after the mock latency. */
const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

/** Throw once when the given control flag is set (then clear it). */
const maybeFail = (control: "failNextLoad" | "failNextSave") => {
    if (mockConfigControls[control]) {
        mockConfigControls[control] = false
        useConfigStore.getState().setStatus("error")
        throw new Error("Mock config backend failure")
    }
}

/**
 * Mock {@link ConfigService} — reads/writes the persisted zustand store with a
 * simulated delay and console-toggleable failures. Only `"global"` scope carries
 * data; the UI blocks env scopes behind a "coming soon" panel before calling in.
 */
export const mockConfigService: ConfigService = {
    listFlags: async () => {
        useConfigStore.getState().setStatus("loading")
        await delay()
        maybeFail("failNextLoad")
        useConfigStore.getState().setStatus("idle")
        return useConfigStore.getState().flags
    },
    setFlag: async (key, patch) => {
        const store = useConfigStore.getState()
        store.setStatus("loading")
        await delay()
        maybeFail("failNextSave")
        const current = store.flags.find((flag) => flag.key === key)
        if (!current) throw new Error(`Unknown flag: ${key}`)
        const updated: FeatureFlag = {
            ...current,
            ...patch,
            lastChangedAt: new Date().toISOString(),
            lastChangedBy: CONFIG_AUDIT_YOU,
        }
        store.setFlag(updated)
        store.setStatus("idle")
        return updated
    },
    getGroup: async (category) => {
        useConfigStore.getState().setStatus("loading")
        await delay()
        maybeFail("failNextLoad")
        useConfigStore.getState().setStatus("idle")
        return useConfigStore.getState().groups[category]
    },
    saveGroup: async (category, values) => {
        const store = useConfigStore.getState()
        store.setStatus("loading")
        await delay()
        maybeFail("failNextSave")
        const group = store.groups[category]
        const updated: SettingGroup = {
            ...group,
            fields: group.fields.map((field) =>
                field.key in values ? { ...field, value: values[field.key] } : field,
            ),
            lastChangedAt: new Date().toISOString(),
            lastChangedBy: CONFIG_AUDIT_YOU,
        }
        store.setGroup(updated)
        store.setStatus("idle")
        return updated
    },
}

/** The active config service — swap the assignment when the BE config-service lands. */
export const configService: ConfigService = mockConfigService
