import { expect, test } from "@playwright/test"

/**
 * E2E — the 5th top-level module, and where Blog went.
 *
 * Blog USED to be that 5th module. On 2026-08-19 Leaderboard took the slot and Blog
 * moved into the Community left rail, so this spec pins the new shape on both counts:
 * the header must list Leaderboard last (not Blog), and Blog must still be reachable —
 * from the community rail rather than the header.
 *
 * Both the desktop header and the mobile drawer render from the single shared
 * `useAppNav` source, so a module must appear on both surfaces, navigate, close the
 * drawer on mobile, and light up (aria-current="page") on its route and every
 * sub-route but never on the home route.
 *
 * The active state is derived client-side from the pathname, so the sub-route
 * assertion needs no real content — the header lights up regardless of whether the
 * page itself 200s.
 */

const isDesktop = (width: number) => width >= 768

test.describe("Leaderboard tab — desktop header (≥ md)", () => {
    test.beforeEach(({ viewport }) => {
        test.skip(!viewport || !isDesktop(viewport.width), "desktop-only surface")
    })

    test("renders the five modules with Leaderboard last, and navigates to /leaderboard", async ({ page }) => {
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
        expect(keys).toEqual([
            "nav-home",
            "nav-workplace",
            "nav-course",
            "nav-community",
            "nav-leaderboard",
        ])

        // Label is localized, so reach the row by its stable tour anchor.
        const leaderboard = nav.locator("[data-tour='nav-leaderboard']")
        await expect(leaderboard).toBeVisible()

        await leaderboard.click()
        await expect(page).toHaveURL(/\/leaderboard$/)
    })

    test("Leaderboard is active on /leaderboard and its sub-route, inactive on home", async ({ page }) => {
        await page.goto("/")
        const link = () =>
            page.getByRole("navigation").first().locator("[data-tour='nav-leaderboard']")

        // home: not active
        await expect(link()).not.toHaveAttribute("aria-current", "page")

        // /leaderboard index: active
        await page.goto("/leaderboard")
        await expect(link()).toHaveAttribute("aria-current", "page")

        // /leaderboard/guide: still active (prefix match, client-derived)
        await page.goto("/leaderboard/guide")
        await expect(link()).toHaveAttribute("aria-current", "page")
    })

    test("Blog is gone from the header but still reachable from the community rail", async ({ page }) => {
        await page.goto("/")
        const nav = page.getByRole("navigation").first()
        await expect(nav.getByRole("link", { name: "Blog" })).toHaveCount(0)

        // The rail is the new home for Blog — desktop-only, beside the community feed.
        // Located by href, not by accessible name: the rail's own label is localized
        // ("Cộng đồng" / "Community"), so a name filter would pass in one locale only.
        await page.goto("/community")
        const blog = page.locator("nav a[href$=\"/blog\"]")
        await expect(blog.first()).toBeVisible()

        await blog.first().click()
        await expect(page).toHaveURL(/\/blog$/)
    })
})

test.describe("Leaderboard tab — mobile drawer (< md)", () => {
    test.beforeEach(({ viewport }) => {
        test.skip(!viewport || isDesktop(viewport.width), "mobile-only surface")
    })

    test("drawer shows the Leaderboard row; tapping it navigates and closes the drawer", async ({ page }) => {
        await page.goto("/")

        // open the hamburger drawer. Its trigger is the last accessible-named
        // header button (aria-label is localized: "Mobile navigation" / "Điều
        // hướng mobile"), shown only < md where the desktop nav is hidden.
        const menuButton = page.locator("header button[aria-label]").last()
        await menuButton.click()

        // The drawer renders pressable rows (no href, no `data-tour` — only HeaderNav
        // stamps those), so the row has to be reached by its LABEL. That label is
        // localized, hence the both-locales alternation rather than a bare string.
        const dialog = page.getByRole("dialog")
        const row = dialog.getByText(/^(Leaderboard|Bảng xếp hạng)$/)
        await expect(row.first()).toBeVisible()

        await row.first().click()
        await expect(page).toHaveURL(/\/leaderboard$/)
        // drawer dismissed after navigation
        await expect(dialog).toBeHidden()
    })
})
