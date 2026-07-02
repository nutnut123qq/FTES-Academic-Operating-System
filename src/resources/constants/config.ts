/** Feature-flag lifecycle status: fully off, fully on, or percentage rollout. */
export type FlagStatus = "on" | "off" | "rollout"

/** One feature flag managed in the Config Center (§24 Feature Flags). */
export interface FeatureFlag {
    /** Stable flag key, e.g. `"community.polls"`. */
    key: string
    /** i18n key (full dotted path) of the flag description. */
    descriptionKey: string
    /** Current status. */
    status: FlagStatus
    /** Rollout percentage 0..100 — meaningful when {@link status} is `"rollout"`. */
    rolloutPercent: number
    /** ISO timestamp of the last change (mock). */
    lastChangedAt: string
    /** Handle of who last changed it (mock); {@link CONFIG_AUDIT_YOU} = the current user. */
    lastChangedBy: string
}

/** Input kind of a system setting field. */
export type SettingType = "text" | "number" | "select" | "toggle"

/** Value a system setting can hold. */
export type SettingValue = string | number | boolean

/** One choice of a `select`-type setting. */
export interface SettingOption {
    /** Persisted option value. */
    value: string
    /** i18n key (full dotted path) of the option label. */
    labelKey: string
}

/** Validation constraints of a setting field. */
export interface SettingValidation {
    /** Value must be non-empty. */
    required?: boolean
    /** Minimum (number fields). */
    min?: number
    /** Maximum (number fields). */
    max?: number
    /** RegExp source the text value must match. */
    pattern?: string
}

/** One key-value system setting rendered in a category form. */
export interface SettingField {
    /** Stable setting key, e.g. `"general.siteName"`. */
    key: string
    /** Input kind. */
    type: SettingType
    /** Saved value. */
    value: SettingValue
    /** Choices — only for `select` fields. */
    options?: Array<SettingOption>
    /** Validation constraints. */
    validation?: SettingValidation
    /** i18n key (full dotted path) of the field label. */
    labelKey: string
    /** i18n key (full dotted path) of the muted help line. */
    helpKey?: string
}

/** A category's group of settings + its last-changed audit note (mock). */
export interface SettingGroup {
    /** Matches one setting category id (`"general"`, `"limits"`, …). */
    id: SettingCategory
    /** The settings of the group. */
    fields: Array<SettingField>
    /** ISO timestamp of the last save (mock). */
    lastChangedAt?: string
    /** Handle of who last saved (mock); {@link CONFIG_AUDIT_YOU} = the current user. */
    lastChangedBy?: string
}

/** Config scope — only `"global"` carries real data; per-env is a deferred stub. */
export type ConfigScope = "global" | "production" | "staging"

/** All scopes, in display order. */
export const CONFIG_SCOPES: ReadonlyArray<ConfigScope> = ["global", "production", "staging"]

/** Nav categories of the Config Center, in display order. */
export type ConfigCategory =
    | "general" | "feature-flags" | "appearance"
    | "integrations" | "notifications" | "security" | "limits"

/** Categories that render a setting-group form (everything but `feature-flags`). */
export type SettingCategory = Exclude<ConfigCategory, "feature-flags">

/** All categories, in nav order. */
export const CONFIG_CATEGORIES: ReadonlyArray<ConfigCategory> = [
    "general", "feature-flags", "appearance",
    "integrations", "notifications", "security", "limits",
]

/** The setting-form categories, in nav order. */
export const SETTING_CATEGORIES: ReadonlyArray<SettingCategory> = [
    "general", "appearance", "integrations", "notifications", "security", "limits",
]

/** i18n key (under `admin.config.nav`) per category. */
export const CONFIG_CATEGORY_LABEL_KEY: Record<ConfigCategory, string> = {
    "general": "admin.config.nav.general",
    "feature-flags": "admin.config.nav.featureFlags",
    "appearance": "admin.config.nav.appearance",
    "integrations": "admin.config.nav.integrations",
    "notifications": "admin.config.nav.notifications",
    "security": "admin.config.nav.security",
    "limits": "admin.config.nav.limits",
}

/** localStorage key of the persisted config store (zustand `persist`). */
export const CONFIG_STORAGE_KEY = "ftesaos-config"

/** Sentinel audit handle meaning "the current user" — rendered as t("admin.config.audit.you"). */
export const CONFIG_AUDIT_YOU = "__you__"

/** Session role in the admin RBAC model (mirrors rbac-roles) + signed-out guest. */
export type ConfigSessionRole = "guest" | "member" | "moderator" | "admin" | "superAdmin"

// ponytail: mock session role — no FE session carries a role yet (keycloak session is
// authenticated-only). Swap to the real session role claim when the BE exposes it;
// the guard in ConfigCenter reads only this constant. Flip it to test the forbidden surface.
export const MOCK_SESSION_ROLE: ConfigSessionRole = "superAdmin"

/** Seed feature flags (mock DB — first run only, then localStorage wins). */
export const SEED_FLAGS: ReadonlyArray<FeatureFlag> = [
    {
        key: "community.polls",
        descriptionKey: "admin.config.flagDesc.communityPolls",
        status: "on",
        rolloutPercent: 100,
        lastChangedAt: "2026-06-18T09:30:00.000Z",
        lastChangedBy: "lan.ops",
    },
    {
        key: "search.v2",
        descriptionKey: "admin.config.flagDesc.searchV2",
        status: "rollout",
        rolloutPercent: 25,
        lastChangedAt: "2026-06-25T14:05:00.000Z",
        lastChangedBy: "minh.platform",
    },
    {
        key: "ai.tutor",
        descriptionKey: "admin.config.flagDesc.aiTutor",
        status: "on",
        rolloutPercent: 100,
        lastChangedAt: "2026-06-10T08:00:00.000Z",
        lastChangedBy: "lan.ops",
    },
    {
        key: "gamification.streaks",
        descriptionKey: "admin.config.flagDesc.gamificationStreaks",
        status: "off",
        rolloutPercent: 0,
        lastChangedAt: "2026-05-30T11:45:00.000Z",
        lastChangedBy: "minh.platform",
    },
    {
        key: "payments.wallet",
        descriptionKey: "admin.config.flagDesc.walletPayments",
        status: "rollout",
        rolloutPercent: 10,
        lastChangedAt: "2026-06-28T16:20:00.000Z",
        lastChangedBy: "lan.ops",
    },
]

/** Seed setting groups per category (mock DB). `integrations` is deliberately empty to exercise the empty state. */
export const SEED_GROUPS: Record<SettingCategory, SettingGroup> = {
    general: {
        id: "general",
        lastChangedAt: "2026-06-20T10:00:00.000Z",
        lastChangedBy: "lan.ops",
        fields: [
            {
                key: "general.siteName",
                type: "text",
                value: "FTES Academic Operating System",
                validation: { required: true },
                labelKey: "admin.config.fields.general.siteName.label",
                helpKey: "admin.config.fields.general.siteName.help",
            },
            {
                key: "general.supportEmail",
                type: "text",
                value: "support@ftes.vn",
                validation: { required: true, pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" },
                labelKey: "admin.config.fields.general.supportEmail.label",
                helpKey: "admin.config.fields.general.supportEmail.help",
            },
            {
                key: "general.defaultLocale",
                type: "select",
                value: "vi",
                options: [
                    { value: "vi", labelKey: "admin.config.fields.general.defaultLocale.options.vi" },
                    { value: "en", labelKey: "admin.config.fields.general.defaultLocale.options.en" },
                ],
                labelKey: "admin.config.fields.general.defaultLocale.label",
            },
            {
                key: "general.maintenanceMode",
                type: "toggle",
                value: false,
                labelKey: "admin.config.fields.general.maintenanceMode.label",
                helpKey: "admin.config.fields.general.maintenanceMode.help",
            },
        ],
    },
    appearance: {
        id: "appearance",
        lastChangedAt: "2026-06-15T07:30:00.000Z",
        lastChangedBy: "minh.platform",
        fields: [
            {
                key: "appearance.defaultAccent",
                type: "select",
                value: "indigo",
                options: [
                    { value: "indigo", labelKey: "appearance.accent.names.indigo" },
                    { value: "pink", labelKey: "appearance.accent.names.pink" },
                    { value: "teal", labelKey: "appearance.accent.names.teal" },
                    { value: "emerald", labelKey: "appearance.accent.names.emerald" },
                    { value: "amber", labelKey: "appearance.accent.names.amber" },
                    { value: "violet", labelKey: "appearance.accent.names.violet" },
                ],
                labelKey: "admin.config.fields.appearance.defaultAccent.label",
                helpKey: "admin.config.fields.appearance.defaultAccent.help",
            },
            {
                key: "appearance.defaultEffectEnabled",
                type: "toggle",
                value: true,
                labelKey: "admin.config.fields.appearance.defaultEffectEnabled.label",
                helpKey: "admin.config.fields.appearance.defaultEffectEnabled.help",
            },
        ],
    },
    // empty on purpose: the Config Center empty state renders for this category
    integrations: {
        id: "integrations",
        fields: [],
    },
    notifications: {
        id: "notifications",
        lastChangedAt: "2026-06-22T13:15:00.000Z",
        lastChangedBy: "lan.ops",
        fields: [
            {
                key: "notifications.emailDigest",
                type: "toggle",
                value: true,
                labelKey: "admin.config.fields.notifications.emailDigest.label",
                helpKey: "admin.config.fields.notifications.emailDigest.help",
            },
            {
                key: "notifications.digestFrequency",
                type: "select",
                value: "weekly",
                options: [
                    { value: "daily", labelKey: "admin.config.fields.notifications.digestFrequency.options.daily" },
                    { value: "weekly", labelKey: "admin.config.fields.notifications.digestFrequency.options.weekly" },
                ],
                labelKey: "admin.config.fields.notifications.digestFrequency.label",
            },
        ],
    },
    security: {
        id: "security",
        lastChangedAt: "2026-06-12T09:00:00.000Z",
        lastChangedBy: "minh.platform",
        fields: [
            {
                key: "security.allowSelfSignup",
                type: "toggle",
                value: true,
                labelKey: "admin.config.fields.security.allowSelfSignup.label",
                helpKey: "admin.config.fields.security.allowSelfSignup.help",
            },
            {
                key: "security.sessionTimeoutMinutes",
                type: "number",
                value: 120,
                validation: { required: true, min: 5, max: 1440 },
                labelKey: "admin.config.fields.security.sessionTimeoutMinutes.label",
                helpKey: "admin.config.fields.security.sessionTimeoutMinutes.help",
            },
            {
                key: "security.showPermissionMatrix",
                type: "toggle",
                value: true,
                labelKey: "admin.config.fields.security.showPermissionMatrix.label",
                helpKey: "admin.config.fields.security.showPermissionMatrix.help",
            },
        ],
    },
    limits: {
        id: "limits",
        lastChangedAt: "2026-06-26T17:40:00.000Z",
        lastChangedBy: "lan.ops",
        fields: [
            {
                key: "limits.maxUploadMb",
                type: "number",
                value: 100,
                validation: { required: true, min: 1, max: 500 },
                labelKey: "admin.config.fields.limits.maxUploadMb.label",
                helpKey: "admin.config.fields.limits.maxUploadMb.help",
            },
            {
                key: "limits.maxCoursesPerUser",
                type: "number",
                value: 20,
                validation: { required: true, min: 1 },
                labelKey: "admin.config.fields.limits.maxCoursesPerUser.label",
            },
            {
                key: "limits.apiRateLimitPerMin",
                type: "number",
                value: 600,
                validation: { required: true, min: 10, max: 10000 },
                labelKey: "admin.config.fields.limits.apiRateLimitPerMin.label",
                helpKey: "admin.config.fields.limits.apiRateLimitPerMin.help",
            },
        ],
    },
}
