import { expect, test } from "@playwright/test"
import { loginAs } from "./helpers/auth"

/**
 * E2E — change `ai-code-grading-model-picker` (solver surface, live BE).
 *
 * Seed data (apitest): V215 bank challenge `demo-bank-code-c-swap`
 * ("[DEMO] Kho: Viết hàm hoán vị", coding, COURSE_ONLY on `demo-c-co-ban`)
 * opened through the learn shell by the enrolled student.
 *
 *  - Grading leg: a simple Python submission with one test case returns BOTH the
 *    objective test-case table (Judge0) and the rubric (score/criteria) with the
 *    mandatory "Chấm bởi {model}" chip. Runs with the DEFAULT model + DEFAULT
 *    language (python) because every HeroUI dropdown selection on this surface is
 *    currently broken — see the picker leg.
 *  - Picker leg: picking a model must relabel the trigger with the picked model —
 *    this DOCUMENTS the e2e-found bug (DropdownItem without `id` → the picked key
 *    is an auto "react-aria-N" string, which would ride the grade body and 400).
 *  - 3.2 (ChallengeSubmission last-grade view) — N/A: tasks.md defers it (URL
 *    submission surface needs its own contract). 3.4 (async realtime) — N/A while
 *    the BE grades synchronously.
 *
 * Grading spends real LLM quota — exactly ONE grade call in this file.
 */

const API_BASE = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"
// ChallengeView (the solver with GradeCodePanel) mounts on the standalone
// /challenges/[id] route; the learn-shell challenge route is ChallengeSubmission.
const CHALLENGE_URL = "/vi/challenges/demo-bank-code-c-swap"

/** A correct little Python program for the swap exercise (stdin: two ints → swapped). */
const PY_SOLUTION = `def swap(a, b):
    return b, a

x, y = map(int, input().split())
x, y = swap(x, y)
print(f"{x} {y}")
`

test.describe.configure({ mode: "serial" })

/** Pre-seed the consent cookie so the fixed-bottom banner never renders/intercepts. */
const suppressCookieBanner = async (page: import("@playwright/test").Page) => {
    await page.context().addCookies([
        {
            name: "ftesaos-cookie-consent",
            value: encodeURIComponent(JSON.stringify({ analytics: false })),
            domain: "localhost",
            path: "/",
        },
    ])
}

test.describe("ai-code-grading-model-picker", () => {
    test("coding challenge → GradeCodePanel grades a solution: test-case table + rubric + graded-by chip", async ({ page }) => {
        test.setTimeout(300_000)
        await loginAs(page, "student")
        await suppressCookieBanner(page)
        await page.goto(CHALLENGE_URL)

        // the solver surface loads the real challenge with the grade panel (no placeholder)
        await expect(page.getByText(/hoán vị/i).first()).toBeVisible({ timeout: 60_000 })
        const editor = page.getByLabel("Bài làm của bạn")
        await expect(editor).toBeVisible({ timeout: 60_000 })

        // code + one verifiable test case (input "1 2" → output "2 1"); language stays
        // on the python default (language dropdown selection is broken — picker leg)
        await editor.fill(PY_SOLUTION)
        await page.getByLabel("Input").first().fill("1 2")
        await page.getByLabel("Kỳ vọng").first().fill("2 1")

        // grade — the ONE LLM call (default model → no `model` field in the body)
        const graded = page.waitForResponse(
            (res) =>
                res.url().includes("/ai/coding/grade-code") && res.request().method() === "POST",
            { timeout: 240_000 },
        )
        await page.getByRole("button", { name: "Chấm bằng AI" }).click()
        const gradeRes = await graded
        expect(gradeRes.status(), "grade-code must succeed").toBe(200)
        const body = gradeRes.request().postDataJSON() as Record<string, unknown>
        expect(body.model).toBeUndefined()
        expect(body.language).toBe("python")
        expect(Array.isArray(body.test_cases)).toBe(true)
        expect(body.run_code_execution).toBe(true)
        expect(String(body.exercise_question)).toContain("hoán vị")

        // objective test-case table (Judge0) — the correct solution passes its case
        await expect(
            page.getByText("Kết quả test case", { exact: true }).first(),
        ).toBeVisible({ timeout: 60_000 })
        await expect(page.getByText(/1\/1 test PASS/).first()).toBeVisible()

        // rubric: score + graded-by chip (mandatory) + criteria
        await expect(page.getByText(/\d+\/\d+ điểm/).first()).toBeVisible()
        await expect(page.getByText(/Chấm bởi /).first()).toBeVisible()

        // re-grade affordance appears (2nd call intentionally NOT made — quota)
        await expect(page.getByRole("button", { name: "Chấm lại" })).toBeVisible()
    })

    test("model picker lists the real catalog and picking a model relabels the trigger", async ({ page }) => {
        test.setTimeout(180_000)
        const token = await loginAs(page, "student")

        // real catalog → candidate ≠ default (not down)
        const catalogRes = await page.request.get(`${API_BASE}/ai/models`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        const catalog = (await catalogRes.json()).data as {
            models: Array<{ id: string; label?: string; status?: string }>
            defaults?: { chat?: string }
        }
        const candidate = catalog.models.find(
            (model) => model.id && model.id !== catalog.defaults?.chat && model.status !== "down",
        )
        expect(candidate, "catalog must offer a selectable non-default model").toBeTruthy()
        if (!candidate) return

        await suppressCookieBanner(page)
        await page.goto(CHALLENGE_URL)
        await expect(page.getByLabel("Bài làm của bạn")).toBeVisible({ timeout: 60_000 })

        // picker opens with the default entry + the full catalog
        const pickerTrigger = page
            .locator('[data-slot="dropdown-trigger"]')
            .filter({ hasText: /Mặc định|Model mặc định/ })
            .first()
        await expect(pickerTrigger).toBeVisible({ timeout: 30_000 })
        await pickerTrigger.click()
        await expect(
            page.getByRole("menuitem").filter({ hasText: "Model mặc định" }).first(),
        ).toBeVisible({ timeout: 10_000 })
        const pickedLabel = candidate.label ?? candidate.id
        const item = page.getByRole("menuitem").filter({ hasText: pickedLabel }).first()
        await expect(item).toBeVisible()
        await item.click()

        // the trigger must relabel with the picked model (label or id) — a
        // "react-aria-N" value here is the DropdownItem-without-`id` bug and would
        // ride the grade body as an invalid model. NOTE: after a pick, the picker
        // trigger no longer says "Mặc định", so re-locate it as the non-language
        // dropdown trigger.
        const modelTrigger = page
            .locator('[data-slot="dropdown-trigger"]')
            .filter({ hasNotText: /Python|Java|C\+\+/ })
            .first()
        await expect
            .poll(() => modelTrigger.innerText(), { timeout: 15_000 })
            .toContain(pickedLabel)
    })

    test("3.2 — ChallengeSubmission last-grade review: N/A in this change (URL-submission surface, contract deferred)", async () => {
        test.skip(
            true,
            "tasks.md 3.2: ChallengeSubmission submits URLs, needs its own BE contract — deferred; no UI shipped to verify",
        )
    })
})
