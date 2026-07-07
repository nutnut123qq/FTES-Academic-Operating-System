/**
 * Apollo response shapes for the `me` query.
 *
 * Mirrors the real backend GraphQL type `Viewer` (schema.graphqls):
 *   me: Viewer!  →  { user: PublicUser!, progression, permissions, scopedGrants }
 * There is NO `{ success, message, error, data }` envelope on `me` — the resolver
 * returns the `Viewer` object directly.
 */

/** Public, non-PII identity fields (GraphQL `PublicUser`). */
export interface ViewerPublicUser {
    id: string
    username: string | null
    displayName: string | null
    avatarUrl: string | null
}

/** Gamification progression (GraphQL `Progression`). */
export interface ViewerProgression {
    totalXp: number
    level: number
    levelTitle: string | null
    reputation: number
}

/** One scoped role grant (GraphQL `ScopedGrant`). */
export interface ViewerScopedGrant {
    roleCode: string
    scopeType: string
    scopeId: string | null
    expiresAt: string | null
}

/** The current viewer (GraphQL `Viewer`). */
export interface ViewerData {
    user: ViewerPublicUser
    progression: ViewerProgression | null
    permissions: Array<string>
    scopedGrants: Array<ViewerScopedGrant>
}

/** Apollo response shape for the `me` query. */
export interface QueryMeResponse {
    /** Top-level `me` field — the `Viewer` object, returned directly (no envelope). */
    me: ViewerData
}
