import { type Page, request } from "@playwright/test"

/**
 * E2E login helper — programmatic, no login form.
 *
 * Flow mirrors the real app session shape: REST login → access token in
 * localStorage under `keycloak:access_token` (set before any page script runs)
 * + a `session_hint` cookie so the edge middleware lets gated routes render.
 * Credentials come from env (`FTES_TEST_PASSWORD`); emails are the shared
 * apitest test accounts. Token TTL is ~15min — call per test, not per suite.
 */

const API_BASE = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"

export type Role = "student" | "lecturer" | "ctv"

const EMAILS: Record<Role, string> = {
    student: "student.test@ftes.vn",
    lecturer: "instructor.test@ftes.vn",
    ctv: "ctv.test@ftes.vn",
}

const tokenCache = new Map<Role, { token: string; at: number }>()

export const fetchToken = async (role: Role): Promise<string> => {
    const cached = tokenCache.get(role)
    // ponytail: 10-min reuse window under the 15-min TTL
    if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.token
    const password = process.env.FTES_TEST_PASSWORD
    if (!password) throw new Error("FTES_TEST_PASSWORD env var is required")
    const ctx = await request.newContext()
    const res = await ctx.post(`${API_BASE}/auth/login`, {
        data: { identifier: EMAILS[role], password },
    })
    const body = await res.json()
    const token = body?.data?.accessToken
    await ctx.dispose()
    if (!token) throw new Error(`login failed for ${role}: ${JSON.stringify(body).slice(0, 200)}`)
    tokenCache.set(role, { token, at: Date.now() })
    return token
}

/** Seed auth state into the browser context BEFORE navigating anywhere. */
export const loginAs = async (page: Page, role: Role): Promise<string> => {
    const token = await fetchToken(role)
    await page.context().addInitScript((t: string) => {
        window.localStorage.setItem("keycloak:access_token", t)
    }, token)
    await page.context().addCookies([
        { name: "session_hint", value: "1", domain: "localhost", path: "/" },
    ])
    return token
}
