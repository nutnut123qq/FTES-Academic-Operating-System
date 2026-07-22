import { expect, test, type Page } from "@playwright/test"
import { loginAs } from "./helpers/auth"

/**
 * E2E — blog engagement (change `blog-nav-and-engagement`, task 3.5 runtime pass).
 * Signed-in student on a REAL apitest article: post heart toggles (count follows the
 * returned BlogReactionResult), a created comment appears in the thread and bumps the
 * "Bình luận (N)" count, and the comment is deleted again through the confirm modal
 * (cleanup doubles as delete coverage). "Load more" is asserted only when the article
 * actually has > 20 comments (conditional — apitest seed data rarely does).
 *
 * Desktop project only (`--project=desktop`); the engagement zone is viewport-agnostic.
 */

test.setTimeout(120_000)

/** Fetches the newest published post's slug straight from the live BE. */
const fetchFirstPostSlug = async (page: Page): Promise<string> => {
    const res = await page.request.get(
        "https://apitest.ftes.vn/api/v1/blog/posts?page=0&size=1",
    )
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    const slug = body?.data?.items?.[0]?.slug
    expect(typeof slug).toBe("string")
    return slug as string
}

test.describe("Blog engagement — signed-in student on a real article", () => {
    test.beforeEach(({ viewport }) => {
        test.skip(!viewport || viewport.width < 768, "desktop project only")
    })

    test("post heart toggles: count changes on like and restores on unlike", async ({ page }) => {
        await loginAs(page, "student")
        const slug = await fetchFirstPostSlug(page)
        await page.goto(`/vi/blog/${slug}`)

        // the heart button carries the localized like/unlike aria-label + the count
        const heart = page.getByRole("button", {
            name: /Thích bài viết này|Bỏ thích bài viết này/,
        })
        await expect(heart).toBeVisible({ timeout: 30_000 })
        // the button text is "<count>" + a sr-only "<count> lượt thích" suffix —
        // read the leading integer only
        const readHeartCount = async () =>
            Number(/\d+/.exec(await heart.innerText())?.[0] ?? Number.NaN)
        const initial = await readHeartCount()
        expect(Number.isNaN(initial)).toBe(false)

        // 1st toggle — count must move by exactly ±1
        await heart.click()
        await expect
            .poll(readHeartCount, { timeout: 20_000 })
            .not.toBe(initial)
        const afterFirst = await readHeartCount()
        expect(Math.abs(afterFirst - initial)).toBe(1)

        // 2nd toggle — restores the original count (leaves apitest data unchanged)
        await heart.click()
        await expect.poll(readHeartCount, { timeout: 20_000 }).toBe(initial)
    })

    test("creating a comment shows it in the thread + bumps the count; delete cleans up", async ({ page }) => {
        await loginAs(page, "student")
        const slug = await fetchFirstPostSlug(page)
        // the heading counts the ACCUMULATED map (0 while the first page is in
        // flight) — wait for the comments GET to settle before reading "before"
        const commentsLoaded = page.waitForResponse(
            (res) =>
                /\/blog\/posts\/[^/]+\/comments/.test(res.url()) &&
                res.request().method() === "GET",
            { timeout: 60_000 },
        )
        await page.goto(`/vi/blog/${slug}`)
        const loadedItems =
            ((await (await commentsLoaded).json())?.data?.items as Array<unknown>) ?? []

        // composer only renders once the signed-in viewer resolves (me query)
        const textarea = page.getByLabel("Viết bình luận…")
        await expect(textarea).toBeVisible({ timeout: 30_000 })

        // deterministic "before": the heading must reflect the merged first page
        const before = loadedItems.length
        await expect(page.getByText(`Bình luận (${before})`)).toBeVisible({
            timeout: 20_000,
        })
        const commentText = `E2E kiểm thử bình luận ${Date.now()}`

        await textarea.fill(commentText)
        await page.getByRole("button", { name: "Gửi", exact: true }).click()

        // the new comment appears and the "Bình luận (N)" count increments
        await expect(page.getByText(commentText, { exact: true })).toBeVisible({
            timeout: 20_000,
        })
        await expect(page.getByText(`Bình luận (${before + 1})`)).toBeVisible({
            timeout: 20_000,
        })

        // like the freshly created comment — its inline count goes 0 → 1
        const row = page
            .locator("div.flex.items-start", { hasText: commentText })
            .last()
        const commentHeart = row.getByRole("button", {
            name: /Thích bình luận này|Bỏ thích bình luận này/,
        })
        await expect(commentHeart).toBeVisible()
        await commentHeart.click()
        await expect(commentHeart).toContainText("1", { timeout: 20_000 })

        // cleanup (and delete coverage): row "Xoá" → confirm modal "Xoá"
        await row.getByRole("button", { name: "Xoá", exact: true }).click()
        const dialog = page.getByText("Xoá bình luận?")
        await expect(dialog).toBeVisible()
        await page
            .locator(".modal__dialog, [role=dialog], [role=alertdialog]")
            .getByRole("button", { name: "Xoá", exact: true })
            .last()
            .click()
        await expect(page.getByText(commentText, { exact: true })).toBeHidden({
            timeout: 20_000,
        })
        await expect(page.getByText(`Bình luận (${before})`)).toBeVisible({
            timeout: 20_000,
        })
    })

    test("load more appears only when the thread has another page (> 20 comments)", async ({ page }) => {
        await loginAs(page, "student")
        const slug = await fetchFirstPostSlug(page)

        // ask the BE directly whether page 0 of 20 has a next page
        const res = await page.request.get(
            `https://apitest.ftes.vn/api/v1/blog/posts?page=0&size=1`,
        )
        const postId = (await res.json())?.data?.items?.[0]?.id as string
        const commentsRes = await page.request.get(
            `https://apitest.ftes.vn/api/v1/blog/posts/${postId}/comments?page=0&size=20`,
        )
        const hasNext = Boolean((await commentsRes.json())?.data?.hasNext)

        await page.goto(`/vi/blog/${slug}`)
        await expect(page.getByText(/Bình luận \(\d+\)/)).toBeVisible({ timeout: 30_000 })

        const loadMore = page.getByRole("button", { name: "Xem thêm bình luận" })
        if (!hasNext) {
            // seed data has ≤ 20 comments → the affordance must NOT render
            await expect(loadMore).toHaveCount(0)
            test.info().annotations.push({
                type: "note",
                description:
                    "BLOCKED-DATA (partial): article has ≤ 20 comments on apitest, so only the hidden-state of load-more is assertable",
            })
            return
        }

        const visibleBefore = await page
            .locator("p.whitespace-pre-wrap")
            .count()
        await loadMore.click()
        await expect
            .poll(async () => page.locator("p.whitespace-pre-wrap").count(), {
                timeout: 20_000,
            })
            .toBeGreaterThan(visibleBefore)
    })
})
