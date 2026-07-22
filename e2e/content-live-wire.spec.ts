import { expect, test, type Page } from "@playwright/test"

/**
 * E2E — live content wiring (change `content-live-wire`, task 5.2 runtime pass).
 * The FE runs locally against the live apitest BE, so the three "could not verify
 * on server" boxes are exercised for real, as a GUEST (all endpoints public):
 *
 *  1. `/vi/courses` hero slider renders REAL banners from
 *     `GET /admin-content/banners?placement=courses` (skips as BLOCKED-DATA when
 *     the BE has no seeded banner — it does today).
 *  2. The category chip bar renders the server-side list from
 *     `GET /courses/categories`.
 *  3. `/vi/blog/[slug]` renders the real post's markdown body (block elements,
 *     not raw markdown text).
 */

test.setTimeout(120_000)

/** Newest published post from the live BE (slug + title for the detail assert). */
const fetchFirstPost = async (page: Page): Promise<{ slug: string; title: string }> => {
    const res = await page.request.get(
        "https://apitest.ftes.vn/api/v1/blog/posts?page=0&size=1",
    )
    expect(res.ok()).toBeTruthy()
    const item = (await res.json())?.data?.items?.[0]
    expect(item?.slug).toBeTruthy()
    return { slug: item.slug as string, title: item.title as string }
}

test.describe("Content live wire — courses + blog on real apitest data", () => {
    test.beforeEach(({ viewport }) => {
        test.skip(!viewport || viewport.width < 768, "desktop project only")
    })

    test("courses hero slider renders the seeded public banners", async ({ page }) => {
        // capture the FE's own banner request (proves the page calls the real endpoint)
        const bannersResponse = page.waitForResponse(
            (res) =>
                res.url().includes("/admin-content/banners") &&
                res.request().method() === "GET",
            { timeout: 60_000 },
        )
        await page.goto("/vi/courses")
        const res = await bannersResponse
        expect(res.status()).toBe(200)
        const banners = (await res.json())?.data as Array<{ title: string }> | null

        test.skip(
            !banners || banners.length === 0,
            "BLOCKED-DATA: backend has no seeded banner for placement=courses",
        )

        // the hero carousel region ("Khóa học nổi bật") shows the FIRST real
        // banner's title (not the mock rows). Category shelves are carousels too,
        // so scope by the localized region label.
        const region = page.getByRole("region", { name: "Khóa học nổi bật" })
        await expect(region).toBeVisible({ timeout: 30_000 })
        await expect(region.getByText(banners![0].title).first()).toBeVisible({
            timeout: 20_000,
        })
    })

    test("category chip bar is server-side (names come from /courses/categories)", async ({ page }) => {
        const categoriesResponse = page.waitForResponse(
            (res) =>
                res.url().includes("/courses/categories") &&
                res.request().method() === "GET",
            { timeout: 60_000 },
        )
        await page.goto("/vi/courses")
        const res = await categoriesResponse
        expect(res.status()).toBe(200)
        const categories = (await res.json())?.data as Array<{ name: string }>
        expect(categories.length).toBeGreaterThan(0)

        const tablist = page.getByRole("tablist")
        await expect(tablist.first()).toBeVisible({ timeout: 30_000 })
        // every server category renders as a chip (tab) with its exact name
        for (const category of categories) {
            await expect(
                tablist.getByRole("tab", { name: category.name }),
            ).toBeVisible({ timeout: 20_000 })
        }
    })

    test("blog detail renders the real post's markdown as rich content", async ({ page }) => {
        const { slug, title } = await fetchFirstPost(page)
        await page.goto(`/vi/blog/${slug}`)

        // real post title in the h1 (data came from GET /blog/posts/slug/{slug})
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(title.trim(), {
            timeout: 30_000,
        })

        // the markdown body rendered into block elements inside the article…
        const article = page.locator("article")
        await expect
            .poll(async () => article.locator("p, h2, h3, ul, ol, img").count(), {
                timeout: 30_000,
            })
            .toBeGreaterThan(0)

        // …and no raw markdown syntax leaked into the visible text
        const bodyText = await article.innerText()
        expect(bodyText).not.toMatch(/(^|\n)#{1,6} /)
    })
})
