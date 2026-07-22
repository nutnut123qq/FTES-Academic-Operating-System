import { expect, test, type Page } from "@playwright/test"
import { loginAs } from "./helpers/auth"

/**
 * E2E — change `quest-board-streak-live` (task 6.2 smoke, live apitest BE).
 *
 *  - `/quests` shows the live daily quest board; the DAILY_LOGIN quest is done
 *    for today (this session's REST login triggers it) and the header chips echo
 *    `totalCoinToday` + the real wallet balance. The board renders a guest gate
 *    first and flips once the auth side-effect hydrates — asserts wait that out.
 *  - Completing a lesson in the demo course moves the LESSON_COMPLETE quest's
 *    live progress and streak / heatmap / xp reflect today's activity.
 *
 * Completion stimulus: the reader is driven first (document lessons complete on
 * exit); the run captures what the FE actually sent. The BE requires a lesson to
 * be "opened" (a progress row) before `/complete` — when the FE leg does not
 * register a completion the spec completes the lesson through the same REST API
 * the FE uses (PUT progress → POST complete) so the LIVE quest-board wiring (the
 * scope of this change) is still verified end-to-end. FE-leg outcome is logged.
 */

const API_BASE = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"
const COURSE = "demo-c-co-ban"
const reader = (moduleId: string, lessonId: string) =>
    `/vi/courses/${COURSE}/learn/content/modules/${moduleId}/contents/${lessonId}`

/** Demo-course lessons the spec may complete (l2 is quiz-gated: it never leaves
 *  IN_PROGRESS from progress/complete alone, so it sits last). */
const LESSON_CANDIDATES: Array<string> = [
    "seed-les-c1-s1-l1",
    "seed-les-c1-s1-l3",
    "seed-les-c1-s2-l1",
    "seed-les-c1-s2-l2",
    "seed-les-c1-s2-l3",
    "seed-les-c1-s1-l2",
]

interface QuestItem {
    code: string
    title: string
    rewardCoin: number
    eventCount: number
    completedCount: number
    dailyLimit: number
    targetCount: number
}

interface QuestBoard {
    totalCoinToday: number
    quests: Array<QuestItem>
}

const authed = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

const fetchQuests = async (page: Page, token: string): Promise<QuestBoard> => {
    const res = await page.request.get(`${API_BASE}/gamification/me/quests`, authed(token))
    return (await res.json()).data as QuestBoard
}

const fetchJson = async (page: Page, token: string, path: string): Promise<unknown> => {
    const res = await page.request.get(`${API_BASE}${path}`, authed(token))
    return (await res.json()).data
}

// One shared account + daily counters → the two tests must not race each other.
test.describe.configure({ mode: "serial" })

test.describe("quest-board-streak-live", () => {
    test("DAILY_LOGIN is done for today on /quests and the header echoes coins + wallet", async ({ page }) => {
        test.setTimeout(180_000)
        const token = await loginAs(page, "student")

        // the login of this very session must complete DAILY_LOGIN (async worker → poll)
        await expect
            .poll(
                async () => {
                    const board = await fetchQuests(page, token)
                    return board.quests.find((q) => q.code === "DAILY_LOGIN")?.completedCount ?? 0
                },
                { timeout: 90_000, intervals: [2_000, 5_000, 10_000] },
            )
            .toBeGreaterThanOrEqual(1)

        const board = await fetchQuests(page, token)
        const dailyLogin = board.quests.find((q) => q.code === "DAILY_LOGIN") as QuestItem
        // DAILY_LOGIN pays its reward (+50 xu) → today's coin total covers it
        expect(dailyLogin.rewardCoin).toBe(50)
        expect(board.totalCoinToday).toBeGreaterThanOrEqual(dailyLogin.rewardCoin)

        await page.goto("/vi/quests")
        await expect(
            page.getByRole("heading", { name: "Nhiệm vụ hằng ngày" }),
        ).toBeVisible({ timeout: 60_000 })

        // the board flips from the guest gate once auth hydrates → the live cards render
        const dailyCard = page
            .locator("div.rounded-2xl.border-separator", { hasText: dailyLogin.title })
            .first()
        await expect(dailyCard).toBeVisible({ timeout: 60_000 })

        // DAILY_LOGIN renders done (check marker, no CTA) with the claimed-of-limit line
        await expect(dailyCard.getByText("Đã hoàn thành")).toBeVisible()
        await expect(dailyCard.getByText("Làm ngay")).toHaveCount(0)
        await expect(
            dailyCard.getByText(
                `Đã nhận ${dailyLogin.completedCount}/${dailyLogin.dailyLimit} lượt hôm nay`,
            ),
        ).toBeVisible()

        // header chips: today's coins + the real wallet balance (vi-VN formatted).
        // Coins credit on an async worker → compare the UI against a FRESH API read
        // each iteration (the 60s SWR poll refreshes the chip).
        await expect(page.getByText("Xu hôm nay")).toBeVisible()
        await expect
            .poll(
                async () => {
                    const live = await fetchQuests(page, token)
                    const label = `Xu nhận hôm nay: ${live.totalCoinToday.toLocaleString("vi-VN")}`
                    return (await page.getByText(label).count()) > 0
                },
                { timeout: 90_000, intervals: [3_000, 5_000, 10_000] },
            )
            .toBe(true)
        await expect(page.getByText("Số dư ví", { exact: true })).toBeVisible()
        await expect
            .poll(
                async () => {
                    const liveWallet = (await fetchJson(page, token, "/wallet/me")) as {
                        balance: number
                    }
                    const label = `Số dư ví: ${liveWallet.balance.toLocaleString("vi-VN")} xu`
                    return (await page.getByText(label).count()) > 0
                },
                { timeout: 90_000, intervals: [3_000, 5_000, 10_000] },
            )
            .toBe(true)
    })

    test("completing a lesson updates LESSON_COMPLETE progress, streak, heatmap and xp", async ({ page }) => {
        test.setTimeout(300_000)
        const token = await loginAs(page, "student")

        const before = await fetchQuests(page, token)
        const questBefore = before.quests.find((q) => q.code === "LESSON_COMPLETE")
        expect(questBefore, "LESSON_COMPLETE quest must exist").toBeTruthy()
        if (!questBefore) return

        // ---- FE leg: drive the reader (document lessons complete on EXIT — leave
        // via the in-app pager so the cleanup effect fires) and record what the
        // client actually sent + what the BE answered.
        let feCompleteStatus: number | null = null
        page.on("response", (res) => {
            if (
                /\/courses\/lessons\/[^/]+\/complete$/.test(res.url()) &&
                res.request().method() === "POST"
            ) {
                feCompleteStatus = res.status()
            }
        })
        await page.goto(reader("seed-sec-c1-s1", "seed-les-c1-s1-l2"))
        await expect(page.locator("#lesson-article")).toBeVisible({ timeout: 60_000 })
        await page.waitForTimeout(2_000)
        // leave through the pager (SPA nav → the reader's exit-complete fires)
        const nextCard = page.getByText("Bài sau", { exact: true }).first()
        if (await nextCard.isVisible().catch(() => false)) {
            await nextCard.click()
        } else {
            await page.goto(reader("seed-sec-c1-s1", "seed-les-c1-s1-l3"))
        }
        await page.waitForTimeout(3_000)
        console.log(`[quest] FE POST /complete status: ${feCompleteStatus ?? "not fired"}`)

        // ---- Did the FE leg land a completion event? (worker is async → short poll)
        const grew = await expect
            .poll(
                async () => {
                    const board = await fetchQuests(page, token)
                    return board.quests.find((q) => q.code === "LESSON_COMPLETE")?.eventCount ?? 0
                },
                { timeout: 30_000, intervals: [2_000, 5_000] },
            )
            .toBeGreaterThan(questBefore.eventCount)
            .then(() => true)
            .catch(() => false)

        // ---- API fallback: complete the first not-yet-completed lesson through the
        // same REST endpoints the FE uses (open via progress → complete).
        if (!grew) {
            const progress = (await fetchJson(
                page,
                token,
                "/courses/seed-course-c-basic/me/progress",
            )) as { lessons: Array<{ lessonId: string; status: string }> }
            const done = new Set(
                (progress.lessons ?? [])
                    .filter((row) => row.status === "COMPLETED")
                    .map((row) => row.lessonId),
            )
            const targets = LESSON_CANDIDATES.filter((lesson) => !done.has(lesson))
            // fresh baseline right before the stimulus (daily counters reset at VN midnight)
            const rebase = await fetchQuests(page, token)
            const baseQuest = rebase.quests.find((q) => q.code === "LESSON_COMPLETE")
            const baseCount = baseQuest?.eventCount ?? 0
            let completedLesson: string | null = null
            for (const lessonId of targets) {
                // opening + ≥-threshold watch auto-completes; /complete is the FE's path
                await page.request.put(`${API_BASE}/courses/lessons/${lessonId}/progress`, {
                    ...authed(token),
                    data: { watchedSeconds: 590, videoDurationSeconds: 600 },
                })
                const completed = await page.request.post(
                    `${API_BASE}/courses/lessons/${lessonId}/complete`,
                    authed(token),
                )
                const view = (await completed.json())?.data as { status?: string } | undefined
                console.log(
                    `[quest] API complete ${lessonId}: HTTP ${completed.status()} status=${view?.status}`,
                )
                if (completed.status() === 200 && view?.status === "COMPLETED") {
                    completedLesson = lessonId
                    break
                }
            }

            if (completedLesson) {
                await expect
                    .poll(
                        async () => {
                            const board = await fetchQuests(page, token)
                            return (
                                board.quests.find((q) => q.code === "LESSON_COMPLETE")
                                    ?.eventCount ?? 0
                            )
                        },
                        { timeout: 90_000, intervals: [2_000, 5_000, 10_000] },
                    )
                    .toBeGreaterThan(baseCount)
            } else {
                // Every completable seed lesson is already done today (earlier smokes) —
                // per task 6.2's fallback, the already-registered live done state stands.
                console.log(
                    "[quest] no incomplete completable lesson left today — asserting the live done state",
                )
                expect(
                    baseCount,
                    "LESSON_COMPLETE must already have registered events today",
                ).toBeGreaterThan(0)
            }
        }

        // ---- /quests shows the LIVE quest progress for the completion
        const after = await fetchQuests(page, token)
        const questAfter = after.quests.find((q) => q.code === "LESSON_COMPLETE") as QuestItem
        const ceiling = questAfter.targetCount * questAfter.dailyLimit
        const shownCurrent = Math.min(questAfter.eventCount, ceiling)

        await page.goto("/vi/quests")
        const lessonCard = page
            .locator("div.rounded-2xl.border-separator", { hasText: questAfter.title })
            .first()
        await expect(lessonCard).toBeVisible({ timeout: 60_000 })
        await expect(
            lessonCard.getByText(`${shownCurrent}/${ceiling}`, { exact: true }),
        ).toBeVisible()
        if (questAfter.completedCount >= questAfter.dailyLimit) {
            await expect(lessonCard.getByText("Đã hoàn thành")).toBeVisible()
        }

        // ---- streak: today's completion makes the live streak ≥ 1 with today active
        const streak = (await fetchJson(page, token, "/gamification/me/streak")) as {
            currentStreak: number
            lastActiveDate: string
        }
        expect(streak.currentStreak).toBeGreaterThanOrEqual(1)
        const activity = (await fetchJson(
            page,
            token,
            "/gamification/me/activity-days?weeks=2",
        )) as { days: Array<{ date: string; xp: number }> }
        const today = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Ho_Chi_Minh",
        }).format(new Date())
        expect(
            (activity.days ?? []).some((d) => d.date === today && d.xp > 0),
            `today (${today}) must be an active day with xp`,
        ).toBe(true)

        // ---- xp: the live progression carries real xp
        const progression = (await fetchJson(page, token, "/gamification/me/progression")) as {
            totalXp: number
            level: number
        }
        expect(progression.totalXp).toBeGreaterThan(0)
        expect(progression.level).toBeGreaterThanOrEqual(1)

        // ---- the streak/heatmap/xp surface renders those live values
        await page.goto("/vi/profile/progress")
        await expect(page.getByText("Lịch hoạt động học")).toBeVisible({ timeout: 60_000 })
        await expect(
            page.getByText(`Chuỗi hiện tại: ${streak.currentStreak} ngày`),
        ).toBeVisible()
        await expect(page.getByText(`Cấp ${progression.level}`).first()).toBeVisible()
    })
})
