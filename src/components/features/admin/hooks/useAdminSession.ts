"use client"

import { useEffect, useState } from "react"
import type { AdminRole } from "@/resources/constants/admin"

/** localStorage key holding the mocked operator role (dev-only RBAC switch). */
export const ADMIN_MOCK_ROLE_STORAGE_KEY = "ftes.adminMockRole"

/** What the console knows about the current operator. */
export interface AdminSession {
    /** The operator's role, or `null` when unauthenticated (guest). */
    role: AdminRole | null
    /** False for guests — the console renders the admin login surface instead. */
    isAuthenticated: boolean
    /** False until the client-side session is hydrated (SSR renders nothing gated). */
    isReady: boolean
}

/**
 * Mock admin session (auth-flows-mock has no persisted session to read yet).
 * The role comes from `localStorage["ftes.adminMockRole"]` — set it to
 * `"guest" | "member" | "moderator" | "admin" | "superAdmin"` in devtools to
 * exercise each RBAC path; it defaults to `"admin"` so the console is browsable.
 *
 * ponytail: BE seam — when the real session lands (Keycloak token roles), read
 * `{ role, isAuthenticated }` from it here; the hook contract stays unchanged
 * and no console component needs edits.
 */
export const useAdminSession = (): AdminSession => {
    const [session, setSession] = useState<AdminSession>({
        role: null,
        isAuthenticated: false,
        isReady: false,
    })

    // hydrate after mount (localStorage is client-only; avoids SSR mismatch)
    useEffect(() => {
        const stored = window.localStorage.getItem(ADMIN_MOCK_ROLE_STORAGE_KEY)
        const roles: Array<AdminRole> = ["member", "moderator", "admin", "superAdmin"]
        const role = roles.find((candidate) => candidate === stored) ?? (stored === "guest" ? null : "admin")
        setSession({ role, isAuthenticated: role !== null, isReady: true })
    }, [])

    return session
}
