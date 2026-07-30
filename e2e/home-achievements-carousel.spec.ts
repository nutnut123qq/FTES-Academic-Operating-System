import { expect, test } from "@playwright/test"

/**
 * E2E — home landing "Thành tựu" achievements carousel (change
 * `home-landing-achievements-carousel`, task 4.4/4.5). The former grid of bare number
 * tiles is now a scroll-snap carousel of milestone cards ported from the legacy
 * `Ftes-frontend` slider: real event photo + year badge ON the photo + title +
 * description + a "Xem chi tiết" link out to the original public evidence.
 *
 * Guest surface (no auth bootstrap) — the section is fully static content, so everything
 * asserted here is what an anonymous visitor sees. The specs cover: all ten milestones
 * render, every photo actually loads over HTTP (not a broken image), evidence links open
 * in a new tab with rel="noopener", milestones without evidence render no link, the
 * arrows really scroll the track, the responsive card count (1 → 2 → 3 per viewport),
 * and that the page never scrolls horizontally on a phone.
 */

const REGION = "[aria-roledescription=\"carousel\"][aria-label=\"Thành tựu của FTES\"]"
const EXPECTED_MILESTONES = 10
/** Milestones that have public evidence (Facebook post / press article). */
const EXPECTED_EVIDENCE_LINKS = 7

const isDesktop = (width: number) => width >= 1024

/** Scrolls the section into view and waits for the lazy cover images to settle. */
const openAchievements = async (page: import("@playwright/test").Page) => {
    await page.goto("/vi")
    const region = page.locator(REGION)
    await region.scrollIntoViewIfNeeded()
    await expect(region).toBeVisible()
    // lazy images only fetch once the strip is on screen
    await page.waitForFunction(
        (selector) => {
            const track = document.querySelector(selector)?.firstElementChild
            const images = track ? [...track.querySelectorAll("img")] : []
            return images.length > 0 && images.every((image) => image.complete && image.naturalWidth > 0)
        },
        REGION,
        { timeout: 20_000 },
    )
    return region
}

test.describe("Home achievements carousel", () => {
    test("renders all ten milestones with title, description and a loaded cover or icon tile", async ({
        page,
    }) => {
        const region = await openAchievements(page)
        const cards = region.locator("> div").first().locator("> *")
        await expect(cards).toHaveCount(EXPECTED_MILESTONES)

        // the eight real photos all decoded; the two photo-less milestones fall back to an icon tile
        const photos = region.locator("img[src^=\"/achievements/\"]")
        await expect(photos).toHaveCount(8)
        const broken = await photos.evaluateAll((images) =>
            images.filter((image) => !(image as HTMLImageElement).naturalWidth).length,
        )
        expect(broken).toBe(0)

        // spot-check the milestones whose copy was written against the evidence photos
        await expect(region.getByText("Top 100 startup xuất sắc · Techfest Vietnam 2025")).toBeVisible()
        await expect(region.getByText("Giải Ba · Khởi nghiệp sáng tạo Gia Lai")).toBeVisible()
        await expect(region.getByText(/Giải Ba vòng chung kết Cuộc thi Thanh niên Gia Lai/)).toBeVisible()

        // year badge on the cover + verbatim rank chip (never an animated counter)
        await expect(region.getByText("2025").first()).toBeVisible()
        await expect(region.getByText("Top 100", { exact: true })).toBeVisible()
        await expect(region.getByText("Top 3", { exact: true })).toBeVisible()
        await expect(region.getByText("100%", { exact: true })).toBeVisible()
    })

    test("evidence links open the original post in a new tab; milestones without evidence have none", async ({
        page,
    }) => {
        const region = await openAchievements(page)
        const links = region.getByRole("link", { name: /Xem chi tiết/ })
        await expect(links).toHaveCount(EXPECTED_EVIDENCE_LINKS)

        const hrefs = await links.evaluateAll((nodes) =>
            nodes.map((node) => ({
                href: node.getAttribute("href"),
                target: node.getAttribute("target"),
                rel: node.getAttribute("rel"),
            })),
        )
        for (const link of hrefs) {
            expect(link.href).toMatch(/^https:\/\//)
            expect(link.target).toBe("_blank")
            expect(link.rel).toContain("noopener")
        }
        // no placeholder / dead links anywhere in the strip
        expect(hrefs.some((link) => link.href === "#")).toBe(false)
        expect(hrefs.filter((link) => link.href?.includes("facebook.com")).length).toBe(6)
    })

    test("next / previous arrows scroll the track", async ({ page, viewport }) => {
        test.skip(!viewport || viewport.width < 640, "arrows are hidden on phones (swipe instead)")
        const region = await openAchievements(page)
        const track = region.locator("> div").first()

        const start = await track.evaluate((node) => node.scrollLeft)
        await region.getByRole("button", { name: "Thành tựu tiếp theo" }).click()
        await expect
            .poll(async () => track.evaluate((node) => node.scrollLeft), { timeout: 5_000 })
            .toBeGreaterThan(start)

        const advanced = await track.evaluate((node) => node.scrollLeft)
        await region.getByRole("button", { name: "Thành tựu trước" }).click()
        await expect
            .poll(async () => track.evaluate((node) => node.scrollLeft), { timeout: 5_000 })
            .toBeLessThan(advanced)
    })

    test("shows three cards per viewport on desktop and never overflows the page on mobile", async ({
        page,
        viewport,
    }) => {
        const region = await openAchievements(page)
        const track = region.locator("> div").first()
        const metrics = await track.evaluate((node) => {
            const card = node.firstElementChild as HTMLElement
            return {
                trackWidth: node.clientWidth,
                cardWidth: card.getBoundingClientRect().width,
                scrollable: node.scrollWidth > node.clientWidth,
                snap: getComputedStyle(node).scrollSnapType,
            }
        })
        expect(metrics.scrollable).toBe(true)
        expect(metrics.snap).toContain("x")

        const perView = metrics.trackWidth / (metrics.cardWidth + 12)
        if (viewport && isDesktop(viewport.width)) {
            expect(perView).toBeGreaterThan(2.8)
            expect(perView).toBeLessThan(3.4)
        } else {
            // phones show one card with a peek of the next, and the PAGE must not scroll sideways
            expect(perView).toBeLessThan(2)
            const pageOverflows = await page.evaluate(
                () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
            )
            expect(pageOverflows).toBe(false)
        }
    })

    test("visual evidence — screenshot of the achievements strip", async ({ page }, testInfo) => {
        const region = await openAchievements(page)
        const shot = await region.screenshot()
        await testInfo.attach(`achievements-${testInfo.project.name}`, {
            body: shot,
            contentType: "image/png",
        })
        expect(shot.byteLength).toBeGreaterThan(10_000)
    })
})
