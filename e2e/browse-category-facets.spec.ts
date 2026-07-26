import { expect, test, type APIRequestContext, type Page } from "@playwright/test"

/**
 * E2E — category landing page chrome (change `catalog-cross-category-facets`) and
 * the blog browse chrome (change `blog-category-first-browse`).
 *
 * `/courses/category/[slug]` must stop being a dead end: a chip bar switches to any
 * other category by REAL route change (locale kept), and the level + minimum-star
 * facets narrow that category's grid. `/courses` must NOT grow those facets (they
 * are optional props on the shared `FacetSortBar`).
 *
 * `/blog` must render the real category chips ABOVE the search box, and keep that
 * row mounted while searching (it used to unmount, so the chrome jumped).
 *
 * The facet counts are derived from the LIVE backend at run time (codes, never
 * hardcoded numbers) so the spec survives apitest data drift. The one semantic rule
 * asserted independently of the data: a course the BE reports with `avgStar` 0 has
 * NOT been rated, so it must disappear from every star facet instead of counting as
 * a zero-star course.
 */

/** REST base of the app under test (same env var the FE reads). */
const API_BASE = process.env.NEXT_PUBLIC_API_HTTP_BASE_URL ?? "https://apitest.ftes.vn/api/v1"

// Every assertion here waits on a live backend behind a dev-server compile, so the
// default 30s budget is too tight for the first hit on each route.
test.describe.configure({ timeout: 90_000 })

/** The category the facet assertions run against (the only one with enough rows). */
const CATEGORY_SLUG = "software-engineering"

/** Star facet segments to walk, with the threshold each one promises. */
const STAR_FACETS: Array<{ label: RegExp; threshold: number }> = [
    { label: /^4\.5 trở lên$/, threshold: 4.5 },
    { label: /^4 trở lên$/, threshold: 4 },
    { label: /^3\.5 trở lên$/, threshold: 3.5 },
]

/** One live course row, reduced to what the facets act on. */
interface LiveCourse {
    code: string
    slug: string
    /** `avgStar` as reported by the BE — 0 means "nobody has rated it yet". */
    star: number
}

/** Reads the live category list and returns the opaque id of one slug. */
const fetchCategory = async (request: APIRequestContext, slug: string) => {
    const response = await request.get(`${API_BASE}/courses/categories`)
    expect(response.ok(), "GET /courses/categories must 200").toBeTruthy()
    const body = await response.json()
    const category = (body.data as Array<{ id: string; name: string; slug: string }>).find(
        (row) => row.slug === slug,
    )
    expect(category, `category "${slug}" must exist on the backend`).toBeTruthy()
    return category!
}

/** Reads the live courses of one category (the same call the page makes). */
const fetchCourses = async (request: APIRequestContext, categoryId: string): Promise<Array<LiveCourse>> => {
    const response = await request.get(`${API_BASE}/courses?categoryId=${categoryId}&size=50`)
    expect(response.ok(), "GET /courses?categoryId= must 200").toBeTruthy()
    const body = await response.json()
    const rows = body.data as Array<{ courseCode: string; slugName: string; avgStar: string }>
    return rows.map((row) => ({
        code: row.courseCode,
        slug: row.slugName,
        star: Number(row.avgStar),
    }))
}

/**
 * Course codes currently on the grid, read from the card links' hrefs (the route
 * contract) and mapped back through the live rows — no styling selectors, no text
 * scraping. Card links are `/<locale>/courses/<slug>`; the nav tab (`/vi/courses`)
 * and the chip routes (`/vi/courses/category/<slug>`) have a different shape.
 */
const gridCodes = async (page: Page, courses: Array<LiveCourse>): Promise<Array<string>> => {
    const codeBySlug = new Map(courses.map((course) => [course.slug, course.code]))
    const hrefs = await page
        .locator("a[href]")
        .evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href") ?? ""))
    return hrefs
        .map((href) => /^\/(?:vi|en)\/courses\/([^/?#]+)$/.exec(href)?.[1])
        .map((slug) => (slug ? codeBySlug.get(slug) : undefined))
        .filter((code): code is string => Boolean(code))
        .sort()
}

/** The chip bar of the category page / catalog (an ARIA tablist). */
const chipBar = (page: Page) => page.getByRole("tablist", { name: "Danh mục khóa học" })

/** The star / level facet groups (ARIA groups labelled by their filter). */
const starFacet = (page: Page) => page.getByRole("group", { name: "Lọc theo số sao" })
const levelFacet = (page: Page) => page.getByRole("group", { name: "Lọc theo cấp độ" })

/**
 * Budget for anything that waits on a client-side route push plus a live API round
 * trip. The 5s `expect` default is too tight against a dev server compiling routes
 * under parallel workers (it flakes on the URL assertion, not on the behaviour).
 */
const NAV_TIMEOUT = 30_000

/** Waits for the grid to settle on a non-empty first paint of the category. */
const waitForGrid = async (page: Page, courses: Array<LiveCourse>) => {
    await expect(page.getByRole("link", { name: new RegExp(courses[0].code) }).first()).toBeVisible({
        timeout: 30_000,
    })
}

test.describe("/courses/category/[slug] — cross-category chips + facets", () => {
    test("chip bar lists every live category with THIS one selected (task 1)", async ({ page, request }) => {
        const category = await fetchCategory(request, CATEGORY_SLUG)
        const response = await request.get(`${API_BASE}/courses/categories`)
        const all = (await response.json()).data as Array<{ name: string; slug: string }>

        await page.goto(`/vi/courses/category/${CATEGORY_SLUG}`)

        const tabs = chipBar(page).getByRole("tab")
        // "Tất cả" + one chip per live category
        await expect(tabs).toHaveCount(all.length + 1, { timeout: NAV_TIMEOUT })
        await expect(tabs.first()).toHaveText("Tất cả")
        for (const row of all) {
            // exact: category names can be substrings of one another as data drifts
            await expect(chipBar(page).getByRole("tab", { name: row.name, exact: true })).toBeVisible()
        }

        // the active chip is this route's category — and only it
        await expect(chipBar(page).getByRole("tab", { name: category.name, exact: true })).toHaveAttribute(
            "aria-selected",
            "true",
        )
        await expect(chipBar(page).getByRole("tab", { selected: true })).toHaveCount(1)
    })

    test("a chip navigates to that category's own route, keeping the locale (task 2)", async ({ page, request }) => {
        const category = await fetchCategory(request, CATEGORY_SLUG)
        const courses = await fetchCourses(request, category.id)
        const language = await fetchCategory(request, "language")
        const languageCourses = await fetchCourses(request, language.id)

        await page.goto(`/vi/courses/category/${CATEGORY_SLUG}`)
        // the chips are client-side route pushes — wait for hydration (first cards
        // painted) or the press lands on dead markup and nothing navigates
        await waitForGrid(page, courses)
        await chipBar(page).getByRole("tab", { name: language.name, exact: true }).click()

        // real route change, locale preserved (never /en/...)
        await expect(page).toHaveURL(/\/vi\/courses\/category\/language$/, { timeout: NAV_TIMEOUT })
        // header renders the switched-to category from BE data
        await expect(page.getByRole("heading", { name: language.name })).toBeVisible({
            timeout: NAV_TIMEOUT,
        })
        // grid swapped to that category's courses
        await waitForGrid(page, languageCourses)
        expect(await gridCodes(page, languageCourses)).toEqual(
            languageCourses.map((course) => course.code).sort(),
        )

        // "Tất cả" leaves the category route for the catalog, still under /vi
        await chipBar(page).getByRole("tab", { name: "Tất cả", exact: true }).click()
        await expect(page).toHaveURL(/\/vi\/courses$/, { timeout: NAV_TIMEOUT })
    })

    test("star facet keeps only rated courses at or above the threshold (task 3)", async ({ page, request }) => {
        const category = await fetchCategory(request, CATEGORY_SLUG)
        const courses = await fetchCourses(request, category.id)
        const unrated = courses.filter((course) => !(course.star > 0))
        expect(
            unrated.length,
            "this assertion needs at least one unrated (avgStar 0) course in the category",
        ).toBeGreaterThan(0)

        await page.goto(`/vi/courses/category/${CATEGORY_SLUG}`)
        await waitForGrid(page, courses)

        // "Tất cả" = the whole category, unrated courses included
        await expect(starFacet(page).getByRole("button", { name: "Tất cả" })).toHaveAttribute(
            "aria-pressed",
            "true",
        )
        expect(await gridCodes(page, courses)).toEqual(courses.map((course) => course.code).sort())

        for (const facet of STAR_FACETS) {
            await starFacet(page).getByRole("button", { name: facet.label }).click()

            const expected = courses
                // > 0 on purpose: "not rated yet" is NOT "zero stars"
                .filter((course) => course.star > 0 && course.star >= facet.threshold)
                .map((course) => course.code)
                .sort()
            await expect
                .poll(() => gridCodes(page, courses), {
                    message: `star facet ${facet.threshold}+ must keep exactly ${expected.join(", ")}`,
                })
                .toEqual(expected)

            // the semantic rule, independent of how the numbers drift
            for (const course of unrated) {
                expect(
                    await gridCodes(page, courses),
                    `${course.code} has no rating → must not pass the ${facet.threshold}+ facet`,
                ).not.toContain(course.code)
            }
        }
    })

    test("level facet filters the grid and empty levels show the empty state (task 4)", async ({ page, request }) => {
        const category = await fetchCategory(request, CATEGORY_SLUG)
        const courses = await fetchCourses(request, category.id)

        await page.goto(`/vi/courses/category/${CATEGORY_SLUG}`)
        await waitForGrid(page, courses)

        // Every level segment must actually drive the grid: the union of the three
        // levels is the whole category, and no level may leave it untouched-but-wrong.
        const perLevel: Record<string, Array<string>> = {}
        for (const level of ["Cơ bản", "Trung cấp", "Nâng cao"]) {
            await levelFacet(page).getByRole("button", { name: level, exact: true }).click()
            await expect(levelFacet(page).getByRole("button", { name: level, exact: true })).toHaveAttribute(
                "aria-pressed",
                "true",
            )
            // let the client-side filter settle before reading the grid
            await page.waitForTimeout(200)
            perLevel[level] = await gridCodes(page, courses)

            if (perLevel[level].length === 0) {
                // an empty level must say so, and must NOT be a dead end (task 6):
                // the chip bar stays mounted to jump to another category
                await expect(page.getByText("Không có khóa học phù hợp.")).toBeVisible()
                await expect(chipBar(page).getByRole("tab").first()).toBeVisible()
            }
        }

        // the three levels partition the category (no course counted twice, none lost)
        const union = [...Object.values(perLevel).flat()].sort()
        expect(union).toEqual(courses.map((course) => course.code).sort())

        // back to "Tất cả" → the whole category returns
        await levelFacet(page).getByRole("button", { name: "Tất cả" }).click()
        await expect
            .poll(() => gridCodes(page, courses))
            .toEqual(courses.map((course) => course.code).sort())
    })

    test("/courses stays facet-free: chips + search + sort only (task 8)", async ({ page }) => {
        await page.goto("/vi/courses")

        // the shared bar is there (search + sort), the two category-page facets are not
        await expect(page.getByPlaceholder("Tìm theo mã hoặc tên môn")).toBeVisible({
            timeout: NAV_TIMEOUT,
        })
        await expect(page.getByRole("group", { name: "Sắp xếp" })).toBeVisible()
        await expect(levelFacet(page)).toHaveCount(0)
        await expect(starFacet(page)).toHaveCount(0)

        // and the catalog still browses by category shelf
        await expect(chipBar(page).getByRole("tab", { name: "Tất cả" })).toBeVisible()
    })
})

test.describe("/blog — real categories first, no hard-coded topic strip", () => {
    test("category chips render ABOVE the search box (task 10)", async ({ page, request }) => {
        const response = await request.get(`${API_BASE}/blog/categories`)
        expect(response.ok(), "GET /blog/categories must 200").toBeTruthy()
        const categories = (await response.json()).data as Array<{ name: string; slug: string }>

        await page.goto("/vi/blog")

        const filter = page.getByRole("group", { name: "Hệ thống FTES AOS, mổ xẻ" })
        await expect(filter).toBeVisible({ timeout: NAV_TIMEOUT })
        for (const category of categories) {
            // exact: one BE category is literally named "Hi", which substring-matches
            // "Chia sẻ" and would resolve to two chips
            await expect(filter.getByRole("button", { name: category.name, exact: true })).toBeVisible()
        }

        // ORDER: the chip row sits above the search input in the document
        const search = page.getByPlaceholder("Tìm bài viết")
        await expect(search).toBeVisible()
        const chipsFirst = await filter.evaluate((node, input) => {
            const relation = node.compareDocumentPosition(input as Node)
            return (relation & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
        }, await search.elementHandle())
        expect(chipsFirst, "the category row must precede the search box").toBeTruthy()

        // the retired hard-coded topic strip is gone for good
        for (const topic of ["CQRS", "Kafka", "Judge0", "Qdrant", "Keycloak", "Mount"]) {
            await expect(page.getByText(topic, { exact: true })).toHaveCount(0)
        }
    })

    test("searching keeps the chip row mounted and falls back to 'Tất cả' (task 12)", async ({ page }) => {
        await page.goto("/vi/blog")

        const filter = page.getByRole("group", { name: "Hệ thống FTES AOS, mổ xẻ" })
        const all = filter.getByRole("button", { name: "Tất cả" })
        const search = page.getByPlaceholder("Tìm bài viết")
        await expect(filter).toBeVisible({ timeout: NAV_TIMEOUT })

        // pick a real category first, so "All" is genuinely not the active chip
        const firstCategory = filter.getByRole("button").nth(1)
        await firstCategory.click()
        await expect(firstCategory).toHaveAttribute("aria-pressed", "true")
        await expect(all).toHaveAttribute("aria-pressed", "false")

        const boxBefore = await filter.boundingBox()

        // typing a query must NOT unmount the row (it used to disappear), and the
        // active chip falls back to "All" because search spans every category
        await search.fill("ftes")
        await expect(filter).toBeVisible()
        // same place, not just still-rendered — the chrome must not jump
        expect(await filter.boundingBox()).toMatchObject({ y: boxBefore!.y })
        await expect(all).toHaveAttribute("aria-pressed", "true")
        await expect(firstCategory).toHaveAttribute("aria-pressed", "false")

        // clearing the box drops back to list mode — the category picked before the
        // search is still the live filter, so its chip lights up again
        await search.fill("")
        await expect(filter).toBeVisible()
        await expect(firstCategory).toHaveAttribute("aria-pressed", "true")
        await expect(all).toHaveAttribute("aria-pressed", "false")
    })
})
