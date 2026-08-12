import { expect, test } from "@playwright/test"

/**
 * E2E — Blog tab, the 5th top-level module (change `blog-nav-and-engagement`,
 * task 1.4). Both the desktop header and the mobile drawer render from the single
 * shared `useAppNav` source, so the tab must appear on both surfaces, navigate to
 * `/blog`, close the drawer on mobile, and light up (aria-current="page") on
 * `/blog` and every `/blog/<slug>` route but never on the home route.
 *
 * The active state is derived client-side from the pathname, so the `/blog/<slug>`
 * assertion needs no real article — the header lights up regardless of whether the
 * article page itself 200s.
 */

const isDesktop = (width: number) => width >= 768

test.describe("Blog tab — desktop header (≥ md)", () => {
    test.beforeEach(({ viewport }) => {
        test.skip(!viewport || !isDesktop(viewport.width), "desktop-only surface")
    })

    test("renders the five modules with Blog last, and navigates to /blog", async ({ page }) => {
        await page.goto("/")

        const nav = page.getByRole("navigation").first()
        const links = nav.getByRole("link")
        // Pin the LIST + ORDER, not a bare count: a count survives "one module added,
        // another dropped" — the exact drift that let the header and this spec disagree
        // for 11 days (Quests left the header in 5e08bf1 and only the unit test followed).
        // Keyed off `data-tour` (HeaderNav stamps `nav-${module.key}`) rather than the
        // visible labels, which are localized ("Trang chủ", "Không gian học", …).
        await expect(links).toHaveCount(5)
        const keys = await links.evaluateAll((els) => els.map((el) => el.getAttribute("data-tour")))
        expect(keys).toEqual(["nav-home", "nav-workplace", "nav-course", "nav-community", "nav-blog"])

        const blog = nav.getByRole("link", { name: "Blog" })
        await expect(blog).toBeVisible()

        await blog.click()
        await expect(page).toHaveURL(/\/blog$/)
    })

    test("Blog is active on /blog and /blog/<slug>, inactive on home", async ({ page }) => {
        await page.goto("/")
        const blogLink = () => page.getByRole("navigation").first().getByRole("link", { name: "Blog" })

        // home: Blog not active
        await expect(blogLink()).not.toHaveAttribute("aria-current", "page")

        // /blog index: active
        await page.goto("/blog")
        await expect(blogLink()).toHaveAttribute("aria-current", "page")

        // /blog/<slug>: still active (prefix match, client-derived)
        await page.goto("/blog/some-article-slug")
        await expect(blogLink()).toHaveAttribute("aria-current", "page")
    })
})

test.describe("Blog tab — mobile drawer (< md)", () => {
    test.beforeEach(({ viewport }) => {
        test.skip(!viewport || isDesktop(viewport.width), "mobile-only surface")
    })

    test("drawer shows Blog row; tapping it navigates to /blog and closes the drawer", async ({ page }) => {
        await page.goto("/")

        // open the hamburger drawer. Its trigger is the last accessible-named
        // header button (aria-label is localized: "Mobile navigation" / "Điều
        // hướng mobile"), shown only < md where the desktop nav is hidden.
        const menuButton = page.locator("header button[aria-label]").last()
        await menuButton.click()

        const dialog = page.getByRole("dialog")
        const blogRow = dialog.getByRole("button", { name: "Blog" }).or(dialog.getByText("Blog", { exact: true }))
        await expect(blogRow.first()).toBeVisible()

        await blogRow.first().click()
        await expect(page).toHaveURL(/\/blog$/)
        // drawer dismissed after navigation
        await expect(dialog).toBeHidden()
    })
})
