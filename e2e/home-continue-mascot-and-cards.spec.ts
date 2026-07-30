import { expect, test, type Page } from "@playwright/test"

/**
 * E2E — home "Tiếp tục học" band: mascot placement + readable course cards (change
 * `home-continue-mascot-and-wider-cards`). The greeting now renders INSIDE the band
 * (under the heading, above the cards) and the grid is capped at two cards per row so
 * the course title is no longer truncated away by the thumbnail + CTA label.
 *
 * These specs do NOT need `FTES_TEST_PASSWORD`: `useQueryMyCoursesSwr` only gates on the
 * PRESENCE of `keycloak:access_token`, and the rows come from
 * `GET /courses/me/enrollments` — so seeding a dummy token plus routing that endpoint
 * reproduces the signed-in band faithfully. Redux `authenticated` stays false without a
 * real Keycloak session, so the greeting shows its guest copy; what is asserted here is
 * PLACEMENT and card layout, not the personalized copy.
 */

const MASCOT_IMAGE = "img[alt*=\"FrosTES\" i], img[src*=\"mascot\" i]"
const LONG_TITLE = "Làm quen cơ sở dữ liệu SQL Server + JDBC cho người mới bắt đầu"

/** Signed-in-looking session with three enrollments (one very long title, one cover-less). */
const seedEnrollments = async (page: Page) => {
    await page.context().addInitScript(() => {
        window.localStorage.setItem("keycloak:access_token", "e2e-dummy-token")
        window.localStorage.setItem("ftes.tour.onboarding.done", "1")
    })
    await page.context().addCookies([
        {
            name: "ftesaos-cookie-consent",
            value: encodeURIComponent(JSON.stringify({ analytics: false })),
            domain: "localhost",
            path: "/",
        },
    ])
    await page.route("**/courses/me/enrollments**", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            // BE envelope: restRequest throws unless `code` is 200
            body: JSON.stringify({
                code: 200,
                message: "OK",
                data: [
                    {
                        courseId: "c1",
                        courseTitle: LONG_TITLE,
                        slugName: "sql-server-jdbc",
                        completionPercent: 12,
                        active: true,
                        published: true,
                        isPurchased: true,
                        imageHeader: "/achievements/demo-day.jpg",
                    },
                    {
                        courseId: "c2",
                        courseTitle: "Java Spring Framework",
                        slugName: "java-spring",
                        completionPercent: 0,
                        active: true,
                        published: true,
                        isPurchased: true,
                        imageHeader: "/achievements/ttsg.jpg",
                    },
                    {
                        // no imageHeader → must degrade to an empty framed surface
                        courseId: "c3",
                        courseTitle: "Rèn luyện tư duy giải quyết vấn đề",
                        slugName: "tu-duy",
                        completionPercent: 40,
                        active: true,
                        published: true,
                        isPurchased: false,
                        imageHeader: null,
                    },
                ],
            }),
        })
    })
}

/** The "Tiếp tục học" band — located by its heading, which the band always renders. */
const continueBand = (page: Page) =>
    page.locator("section").filter({ has: page.getByRole("heading", { name: /Tiếp tục học/i }) })

test.describe("Home continue-learning band — signed-in (mocked enrollments)", () => {
    test.beforeEach(async ({ page }) => {
        await seedEnrollments(page)
        await page.goto("/vi")
    })

    test("mascot renders INSIDE the band, under the heading and above the cards", async ({
        page,
    }) => {
        const band = continueBand(page).first()
        await expect(band).toBeVisible()

        const mascotInBand = band.locator(MASCOT_IMAGE).first()
        await expect(mascotInBand).toBeVisible()

        // vertical order inside the band: heading → mascot → first card
        const heading = band.getByRole("heading", { name: /Tiếp tục học/i })
        const firstCard = band.getByRole("link", { name: new RegExp(LONG_TITLE.slice(0, 20)) })
        const [headingBox, mascotBox, cardBox] = await Promise.all([
            heading.boundingBox(),
            mascotInBand.boundingBox(),
            firstCard.boundingBox(),
        ])
        expect(headingBox && mascotBox && cardBox).toBeTruthy()
        expect(mascotBox!.y).toBeGreaterThan(headingBox!.y)
        expect(cardBox!.y).toBeGreaterThan(mascotBox!.y)
    })

    test("exactly one mascot on the page (no duplicate band below)", async ({ page }) => {
        await expect(continueBand(page).first()).toBeVisible()
        await expect(page.locator(MASCOT_IMAGE)).toHaveCount(1)
    })

    test("cards stay at two per row and show the full course title", async ({ page, viewport }) => {
        const band = continueBand(page).first()
        const grid = band.locator("div.grid")
        const metrics = await grid.evaluate((node) => {
            const style = getComputedStyle(node)
            const card = node.firstElementChild as HTMLElement
            return {
                columns: style.gridTemplateColumns.split(" ").filter(Boolean).length,
                cardWidth: card.getBoundingClientRect().width,
            }
        })
        // 2 columns from sm up, 1 on phones — never 4
        expect(metrics.columns).toBeLessThanOrEqual(2)

        const title = band.getByText(LONG_TITLE, { exact: false }).first()
        await expect(title).toBeVisible()
        const titleBox = await title.boundingBox()
        expect(titleBox).toBeTruthy()
        if (viewport && viewport.width >= 640) {
            // the text column must be wide enough to actually read the course name
            expect(titleBox!.width).toBeGreaterThan(200)
        }
        // and the visible text really is the course name (not clipped to nothing)
        await expect(title).toHaveText(new RegExp(LONG_TITLE.slice(0, 25)))

        // a name too long for one line wraps to a SECOND line instead of ending in "…"
        const lines = await title.evaluate((node) => {
            const style = getComputedStyle(node)
            const lineHeight = Number.parseFloat(style.lineHeight) || 24
            return Math.round(node.getBoundingClientRect().height / lineHeight)
        })
        expect(lines).toBeGreaterThanOrEqual(2)
    })

    test("a course without a cover image still renders its card and title", async ({ page }) => {
        const band = continueBand(page).first()
        await expect(band.getByText("Rèn luyện tư duy giải quyết vấn đề")).toBeVisible()
        await expect(band.getByRole("link", { name: /Rèn luyện tư duy/ })).toBeVisible()
    })

    test("visual evidence — screenshot of the continue-learning band", async ({ page }, testInfo) => {
        const band = continueBand(page).first()
        await expect(band).toBeVisible()
        const shot = await band.screenshot()
        await testInfo.attach(`continue-band-${testInfo.project.name}`, {
            body: shot,
            contentType: "image/png",
        })
        expect(shot.byteLength).toBeGreaterThan(5_000)
    })
})

test.describe("Home continue-learning band — guest", () => {
    test("band self-hides but the page still shows exactly one mascot", async ({ page }) => {
        await page.goto("/vi")
        await expect(page.getByRole("heading", { name: /Tiếp tục học/i })).toHaveCount(0)
        await expect(page.locator(MASCOT_IMAGE)).toHaveCount(1)
    })
})
