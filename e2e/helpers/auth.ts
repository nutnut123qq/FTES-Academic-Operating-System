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

/**
 * `force` = bỏ qua cache, đăng nhập lại. Cần khi một thao tác vừa ĐỔI VAI của chính tài khoản
 * đó (tạo nhóm → OWNER) — BE trả 401 `IDENTITY_TOKEN_STALE` cho token phát trước khi vai đổi.
 */
export const fetchToken = async (role: Role, force = false): Promise<string> => {
    const cached = tokenCache.get(role)
    // ponytail: 10-min reuse window under the 15-min TTL
    if (!force && cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.token
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

/**
 * Chờ app hydrate phiên đăng nhập vào Redux (`keycloak.authenticated`) — app chỉ bật cờ này SAU
 * khi GraphQL `me` trả về. Mọi nút gated bằng `useRequireAuth` (gửi đánh giá, thích, lưu…) bấm
 * trước thời điểm đó sẽ bị đá vào modal đăng nhập dù localStorage đã có token.
 *
 * Gọi TRƯỚC `page.goto` (trả về promise) rồi `await` sau khi điều hướng.
 */
export const waitForViewer = (page: Page) =>
    page.waitForResponse(
        async (res) =>
            res.url().includes("/graphql") &&
            res.status() === 200 &&
            (await res.text().catch(() => "")).includes('"me"'),
        { timeout: 30_000 },
    )

/** Seed auth state into the browser context BEFORE navigating anywhere. */
export const loginAs = async (page: Page, role: Role): Promise<string> => {
    const token = await fetchToken(role)
    await page.context().addInitScript((t: string) => {
        window.localStorage.setItem("keycloak:access_token", t)
        // Tour chào mừng (onboarding-mascot-guide) là modal z-[1000] chặn MỌI click trên
        // trang đầu tiên chưa có cờ done — login programmatic không đi qua UI nên phải
        // seed cờ, không thì mọi click sau đó treo "subtree intercepts pointer events".
        window.localStorage.setItem("ftes.tour.onboarding.done", "1")
    }, token)
    await page.context().addCookies([
        { name: "session_hint", value: "1", domain: "localhost", path: "/" },
        // Banner cookie-consent là StickyBottomBar cố định đáy màn → nuốt click của mọi nút nằm
        // cuối trang ("Nộp bài"…). Seed lựa chọn từ chối analytics = banner không render.
        {
            name: "ftesaos-cookie-consent",
            value: encodeURIComponent(JSON.stringify({ analytics: false })),
            domain: "localhost",
            path: "/",
        },
    ])
    return token
}
