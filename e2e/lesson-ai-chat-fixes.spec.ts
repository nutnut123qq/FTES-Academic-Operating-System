import { expect, test, type Page } from "@playwright/test"
import { loginAs } from "./helpers/auth"

/**
 * E2E — change `lesson-ai-chat-fixes` (tasks 1.4 / 2.7 / 3.6 e2e legs).
 *
 * Seed data (apitest): student.test@ftes.vn enrolled `demo-c-co-ban`;
 * `seed-les-c1-s1-l2` is a DOCUMENT lesson with a real body (renders
 * `#lesson-article`).
 *
 *  - (a) 1.4: selecting a passage inside the reader and asking the AI sends the
 *    FULL passage + the containing paragraph as a marked reference-data block in
 *    the SSE request body, while the user bubble shows only the truncated quote.
 *  - (b) 2.7: picking a model in the composer rides `model` on the stream body and
 *    the assistant bubble caption echoes the serving model from the `done` event.
 *  - (c) 3.6: desktop → the chat opens as a selection-anchored panel placed next
 *    to the passage (clamped inside the viewport on a narrow window); 375px
 *    mobile → the FAB bottom-sheet drawer instead (no anchored panel).
 *
 * AI streams consume real quota — this file sends exactly 2 messages total.
 */

const API_BASE = process.env.API_BASE ?? "https://apitest.ftes.vn/api/v1"
const COURSE = "demo-c-co-ban"
const LESSON = "seed-les-c1-s1-l2"
const READER_URL = `/vi/courses/${COURSE}/learn/content/modules/seed-sec-c1-s1/contents/${LESSON}`

/** The selection rect + text snapshot the spec compares the panel position against. */
interface SelectedPassage {
    text: string
    rect: { top: number; left: number; right: number; bottom: number }
}

/**
 * Programmatically select the first long paragraph inside `#lesson-article` and
 * fire the `mouseup` the selection-ask listener waits for. Returns the selected
 * text + its bounding rect (viewport coordinates).
 */
/** In-page: the first leaf-ish block in `#lesson-article` with ≥60 chars of text
 *  (the markdown renderer emits styled divs, not semantic `<p>` tags). */
const passageFinder = `(() => {
    const article = document.getElementById("lesson-article")
    if (!article) return null
    const candidates = Array.from(article.querySelectorAll("*")).filter((el) => {
        const text = (el.textContent ?? "").trim()
        if (text.length < 60) return false
        return !Array.from(el.children).some(
            (child) => ((child.textContent ?? "").trim().length) >= 60,
        )
    })
    return candidates[0] ?? null
})()`

const selectPassage = async (page: Page): Promise<SelectedPassage> => {
    await expect(page.locator("#lesson-article")).toBeVisible({ timeout: 60_000 })
    // the markdown body hydrates after the shell — wait for a real text block
    await expect
        .poll(() => page.evaluate(`Boolean(${passageFinder})`), { timeout: 60_000 })
        .toBe(true)
    return page.evaluate(`(() => {
        const paragraph = ${passageFinder}
        if (!paragraph) throw new Error("no selectable paragraph in the article")
        const range = document.createRange()
        range.selectNodeContents(paragraph)
        const selection = window.getSelection()
        if (!selection) throw new Error("no selection API")
        selection.removeAllRanges()
        selection.addRange(range)
        const rect = range.getBoundingClientRect()
        document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }))
        return {
            text: selection.toString().trim(),
            rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom },
        }
    })()`) as Promise<SelectedPassage>
}

/** Decline the cookie banner when present so it never intercepts pointer events. */
const dismissCookieBanner = async (page: Page) => {
    const decline = page.getByRole("button", { name: "Từ chối" })
    if (await decline.isVisible().catch(() => false)) {
        await decline.click()
    }
}

/** Wait for the next SSE message POST and return its parsed JSON body. */
const captureStreamBody = (page: Page) =>
    page
        .waitForRequest(
            (req) =>
                /\/ai\/sessions\/[^/]+\/messages$/.test(req.url()) && req.method() === "POST",
            { timeout: 30_000 },
        )
        .then((req) => JSON.parse(req.postData() ?? "{}") as { content?: string; model?: string })

test.describe("lesson-ai-chat-fixes — desktop", () => {
    test("1.4 — selecting a passage grounds the question: body carries the full passage + context block, bubble hides it, the answer streams", async ({ page }) => {
        test.setTimeout(240_000)
        await loginAs(page, "student")
        await page.goto(READER_URL)
        await dismissCookieBanner(page)

        const passage = await selectPassage(page)
        expect(passage.text.length).toBeGreaterThanOrEqual(60)

        // floating "ask about this" button appears on the selection
        const ask = page.getByRole("button", { name: /Hỏi AI về đoạn này/ })
        await expect(ask).toBeVisible()
        await ask.click()

        // desktop → the selection-anchored panel (portal dialog), with the quote banner
        const panel = page.getByRole("dialog", { name: "Hỏi AI" })
        await expect(panel).toBeVisible()
        await expect(panel.getByText(passage.text.slice(0, 60))).toBeVisible()

        // ask about the passage; capture the stream request body
        const question = "Đoạn này nói về điều gì? Trả lời thật ngắn gọn."
        await panel.getByPlaceholder("Hỏi về bài học…").fill(question)
        const bodyPromise = captureStreamBody(page)
        await panel.getByPlaceholder("Hỏi về bài học…").press("Enter")
        const body = bodyPromise

        const sent = await body
        // the SENT message carries the FULL selected passage (≤600 cap)…
        const fullPassage = passage.text.slice(0, 600)
        expect(sent.content ?? "").toContain(fullPassage.slice(0, 200))
        expect(sent.content ?? "").toContain(question)
        // …plus the containing paragraph as a marked reference-data block
        expect(sent.content ?? "").toContain("Ngữ cảnh đoạn trích")

        // the user BUBBLE shows only the truncated-quote label — never the context block
        await expect(panel.getByText("Ngữ cảnh đoạn trích")).toHaveCount(0)
        await expect(panel.getByText(/Về đoạn/).first()).toBeVisible()

        // the real answer streams in (thinking placeholder resolves, no error copy)
        await expect(panel.getByText("Đang soạn câu trả lời…")).toHaveCount(0, {
            timeout: 180_000,
        })
        await expect(panel.getByText("Xin lỗi, mình chưa trả lời được.")).toHaveCount(0)
        const assistantBubble = panel.locator(".bg-surface-secondary").last()
        await expect(assistantBubble).toBeVisible()
        const answer = (await assistantBubble.innerText()).trim()
        expect(answer.length).toBeGreaterThan(20)
    })

    test("2.7 — picking a model rides `model` on the stream body and the caption echoes the serving model", async ({ page }) => {
        test.setTimeout(240_000)
        const token = await loginAs(page, "student")

        // pick a candidate ≠ default from the real catalog (skip down models)
        const catalogRes = await page.request.get(`${API_BASE}/ai/models`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        const catalog = (await catalogRes.json()).data as {
            models: Array<{ id: string; label?: string; status?: string }>
            defaults?: { chat?: string }
        }
        const defaultChat = catalog.defaults?.chat
        const candidate = catalog.models.find(
            (model) => model.id && model.id !== defaultChat && model.status !== "down",
        )
        expect(candidate, "catalog must offer a non-default selectable model").toBeTruthy()
        if (!candidate) return
        const shortName = candidate.id.slice(candidate.id.lastIndexOf("/") + 1)

        await page.goto(READER_URL)
        await dismissCookieBanner(page)

        // open the chat through the selection-anchored panel (its outside-click
        // handling explicitly whitelists the model dropdown's portaled menu)
        await selectPassage(page)
        await page.getByRole("button", { name: /Hỏi AI về đoạn này/ }).click()
        const chat = page.getByRole("dialog", { name: "Hỏi AI" })
        await expect(chat).toBeVisible()

        // picker shows the catalog default's short name, then switches to the picked model
        const defaultShort = (defaultChat ?? "openai/gpt-oss-120b").split("/").pop() as string
        const trigger = chat.locator("span.truncate", { hasText: defaultShort }).first()
        await expect(trigger).toBeVisible({ timeout: 30_000 })
        await trigger.click()
        const item = page
            .getByRole("menuitem")
            .filter({ hasText: candidate.label ?? shortName })
            .first()
        await expect(item).toBeVisible()
        await item.click()

        // the trigger must relabel to the picked model's short name — a mismatch
        // means the DropdownItem key never reached the store (e2e-found bug:
        // HeroUI DropdownItem without an `id` prop yields an auto "react-aria-N"
        // key, which then rides the API body and the BE rejects with 400)
        const triggerAfter = chat.locator('[data-slot="dropdown-trigger"]').first()
        await expect
            .poll(() => triggerAfter.innerText(), { timeout: 15_000 })
            .toContain(shortName)

        // send → the picked model rides the stream body
        await chat.getByPlaceholder("Hỏi về bài học…").fill("Chào bạn, hãy trả lời đúng một câu.")
        const bodyPromise = captureStreamBody(page)
        await chat.getByPlaceholder("Hỏi về bài học…").press("Enter")
        const sent = await bodyPromise
        expect(sent.model).toBe(candidate.id)

        // the `done` event stamps the serving model as the bubble caption
        await expect(chat.getByText("Đang soạn câu trả lời…")).toHaveCount(0, {
            timeout: 180_000,
        })
        const caption = chat.getByText(/Trả lời bởi /).first()
        await expect(caption).toBeVisible({ timeout: 15_000 })
        const captionText = await caption.innerText()
        expect(captionText, `caption "${captionText}" must echo the picked model`).toContain(
            shortName,
        )
    })

    test("3.6 (desktop) — the panel anchors beside the passage and clamps inside a narrow viewport; Esc dismisses", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await page.goto(READER_URL)
        await dismissCookieBanner(page)

        // wide viewport → the panel sits to the RIGHT of the selection rect
        const passage = await selectPassage(page)
        await page.getByRole("button", { name: /Hỏi AI về đoạn này/ }).click()
        const panel = page.getByRole("dialog", { name: "Hỏi AI" })
        await expect(panel).toBeVisible()
        const wideBox = await panel.boundingBox()
        expect(wideBox).toBeTruthy()
        if (wideBox) {
            const viewport = page.viewportSize()
            if (viewport && passage.rect.right + 12 + 360 <= viewport.width - 8) {
                // fits right → anchored beside the passage (top may clamp upward
                // so the panel stays fully inside the viewport)
                expect(wideBox.x).toBeGreaterThanOrEqual(passage.rect.right)
                expect(wideBox.y).toBeLessThanOrEqual(passage.rect.top + 24)
                expect(wideBox.y).toBeGreaterThanOrEqual(0)
            }
            // always inside the viewport
            expect(wideBox.x).toBeGreaterThanOrEqual(0)
            if (viewport) expect(wideBox.x + wideBox.width).toBeLessThanOrEqual(viewport.width)
        }

        // Esc closes the panel AND clears the passage selection intent
        await page.keyboard.press("Escape")
        await expect(panel).toHaveCount(0)

        // narrow viewport (no side room) → the panel clamps fully inside the viewport
        await page.setViewportSize({ width: 820, height: 800 })
        await selectPassage(page)
        await page.getByRole("button", { name: /Hỏi AI về đoạn này/ }).click()
        await expect(panel).toBeVisible()
        const narrowBox = await panel.boundingBox()
        expect(narrowBox).toBeTruthy()
        if (narrowBox) {
            expect(narrowBox.x).toBeGreaterThanOrEqual(0)
            expect(narrowBox.x + narrowBox.width).toBeLessThanOrEqual(820)
            expect(narrowBox.y).toBeGreaterThanOrEqual(0)
        }
        await page.keyboard.press("Escape")
        await expect(panel).toHaveCount(0)
    })
})

test.describe("lesson-ai-chat-fixes — mobile 375px", () => {
    test.use({ viewport: { width: 375, height: 812 } })

    test("3.6 (mobile) — selection ask opens the bottom-sheet drawer, not the anchored panel", async ({ page }) => {
        test.setTimeout(120_000)
        await loginAs(page, "student")
        await page.goto(READER_URL)
        await dismissCookieBanner(page)

        await selectPassage(page)
        const ask = page.getByRole("button", { name: /Hỏi AI về đoạn này/ })
        await expect(ask).toBeVisible()
        await ask.click()

        // bottom-sheet: the drawer dialog hosting the chat composer
        const dialog = page
            .getByRole("dialog")
            .filter({ has: page.locator('textarea[placeholder="Hỏi về bài học…"]') })
            .last()
        await expect(dialog).toBeVisible()
        await expect(dialog.getByText("Hỏi AI").first()).toBeVisible()
        const dialogClass = (await dialog.getAttribute("class")) ?? ""
        console.log(`[mobile] chat dialog class: ${dialogClass}`)
        expect(dialogClass).toContain("drawer")
        // the fixed-width (360px inline style) anchored panel must NOT mount on mobile
        expect(await page.locator('[role="dialog"][style*="360"]').count()).toBe(0)
        // glued to the bottom edge once the slide-in settles
        await expect
            .poll(
                async () => {
                    const box = await dialog.boundingBox()
                    return box ? Math.abs(box.y + box.height - 812) : 9_999
                },
                { timeout: 10_000 },
            )
            .toBeLessThanOrEqual(8)
    })
})
