import { expect, test } from "@playwright/test"

import { loginAs } from "./helpers/auth"

/**
 * Nghiệm thu E2E 2026-07-25 — challenge-lesson-level-access-gate, ca chính "tier thấp".
 *
 * Seed trên apitest (phiên này, bằng token admin): challenge MULTIPLE_CHOICE
 * `e2e-tier-gate-20260725` thuộc course PRF192 (saleMode PACKAGE), gắn bài
 * `[Tài liệu]` — bài này chỉ mở cho gói `premium`/`master`.
 * `ctv.test` ĐÃ được admin-grant ghi danh course nhưng KHÔNG sở hữu gói nào ⇒ BE trả
 * 403 `CHALLENGE_COURSE_ACCESS_DENIED` kèm `data.requiredPackageSlugs=[premium,master]`
 * (nhánh lesson-level, khác hẳn nhánh "chưa ghi danh" vốn không có slugs).
 *
 * Kịch bản kiểm: FE đọc được slugs đó ⇒ hiện CTA "Nâng cấp gói" + chip tên gói,
 * KHÔNG rơi về CTA ghi danh.
 */

const COURSE = "goi-prf192prf193---nhap-mon-lap-trinh-cc"
const MODULE = "408c301a-d1c0-4041-a2a1-93e5da30d443"
const LESSON = "d581bf18-27f8-4df1-9c7e-535c782b7631"
const CHALLENGE = "019f98c1-ce6e-7ab2-a77c-a4c1e2d32761"

test("challenge gắn bài tier cao → CTA nâng cấp gói, không phải CTA ghi danh", async ({ page }) => {
    await loginAs(page, "ctv")

    const denials: unknown[] = []
    page.on("response", async (r) => {
        if (r.url().includes("/challenges/") && r.status() === 403) {
            denials.push(await r.json().catch(() => null))
        }
    })

    await page.goto(
        `/vi/courses/${COURSE}/learn/content/modules/${MODULE}/contents/${LESSON}/challenges/${CHALLENGE}`,
    )

    const cta = page.getByRole("button", { name: /nâng cấp gói/i })
    await expect(cta).toBeVisible({ timeout: 30_000 })
    // Chip tier nằm trong CHÍNH panel access-denied (không phải tên bài ở sidebar).
    const panel = page.locator("div").filter({ has: cta }).last()
    await expect(panel.getByText(/premium/i).first()).toBeVisible()
    // KHÔNG rơi về nhánh "chưa ghi danh".
    await expect(page.getByRole("button", { name: /ghi danh|đăng ký học/i })).toHaveCount(0)

    const denied = denials.find(
        (d) => (d as { data?: { errorCode?: string } })?.data?.errorCode === "CHALLENGE_COURSE_ACCESS_DENIED",
    ) as { data?: { requiredPackageSlugs?: string[] } } | undefined
    expect(denied?.data?.requiredPackageSlugs).toEqual(["premium", "master"])
})
