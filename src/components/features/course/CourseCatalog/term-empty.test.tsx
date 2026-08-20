/**
 * Component — the catalog's term facet must never leave the page BLANK.
 *
 * Filtering by a term is a server-side fetch that legitimately comes back empty
 * (a term created by an admin before any course is attached to it — `GET /terms`
 * lists every term regardless of status, so such a term is in the dropdown from
 * the moment it exists). The catalog's empty branch used to be gated on the SEARCH
 * box being non-empty, so this exact case rendered an empty container: no copy, no
 * way back — indistinguishable from a broken page.
 *
 * Also pinned: a term that disappears from `GET /terms` (deleted while someone is
 * browsing) stops filtering, because the dropdown unmounts with it and nothing
 * would be left on screen to clear the filter.
 *
 * `t` echoes the key, so assertions read against `courseSystem.browse.*`.
 */
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import type { Course } from "../hooks/useQueryCoursesSwr"
import type { PublicTermView } from "@/modules/api/rest/course"

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@heroui/react", () => ({
    cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Button: ({ children, onPress }: { children: React.ReactNode, onPress?: () => void }) => (
        <button type="button" onClick={onPress}>{children}</button>
    ),
}))

vi.mock("@phosphor-icons/react", () => ({
    MagnifyingGlassIcon: () => <span />,
    TrayIcon: () => <span />,
}))

vi.mock("./FeaturedSlider", () => ({ FeaturedSlider: () => null }))

let terms: Array<PublicTermView>
vi.mock("../hooks/useQueryTermsSwr", () => ({
    useQueryTermsSwr: () => ({ terms }),
}))

vi.mock("../hooks/useQueryCourseCategoriesSwr", () => ({
    useQueryCourseCategoriesSwr: () => ({
        categories: [{ id: "cat-1", slug: "web", name: "Web" }],
        isLoading: false,
    }),
}))

/** `termId` the catalog last asked the fetch layer for — the server-side half of the facet. */
const askedTermId = vi.fn()
/** Courses the fetch resolves with, keyed by the requested term (`""` = no term). */
let coursesByTerm: Record<string, Array<Course>>
vi.mock("../hooks/useQueryCoursesSwr", () => ({
    useQueryCoursesSwr: ({ termId }: { termId?: string } = {}) => {
        askedTermId(termId)
        return {
            courses: coursesByTerm[termId ?? ""] ?? [],
            isLoading: false,
            error: undefined,
            mutate: vi.fn(),
        }
    },
    sortCourses: (courses: Array<Course>) => courses,
    coursesByCategory: (courses: Array<Course>, categoryId: string) =>
        courses.filter((course) => course.category === categoryId),
}))

// The browse pieces are mocked down to what this file asserts on: the facet bar
// exposes one button per term (so a case can "pick" one), the shelf lists titles.
vi.mock("../browse", () => ({
    CategoryChipBar: () => null,
    CategoryGridSkeleton: () => null,
    CategoryShelfSkeleton: () => null,
    CatalogCourseCard: ({ course }: { course: Course }) => <div data-testid="card">{course.name}</div>,
    CourseHoverPreview: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    CategoryShelf: ({ courses }: { courses: Array<Course> }) => (
        <div data-testid="shelf">
            {courses.map((course) => <div key={course.id} data-testid="card">{course.name}</div>)}
        </div>
    ),
    FacetSortBar: ({ terms: options, termId, onTermChange }: {
        terms?: Array<PublicTermView>
        termId?: string
        onTermChange?: (next: string | undefined) => void
    }) => (
        <div data-testid="facet-bar" data-term={termId ?? ""}>
            {(options ?? []).length > 0 ? (
                <div data-testid="term-picker">
                    {(options ?? []).map((term) => (
                        <button key={term.id} type="button" onClick={() => onTermChange?.(term.id)}>
                            {term.name}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    ),
}))

import { CourseCatalog } from "./index"

const TERM: PublicTermView = {
    id: "t-spring-2027",
    code: "SP27",
    name: "Kỳ Xuân 2027",
    startsAt: "2027-01-01T00:00:00Z",
    endsAt: "2027-05-31T00:00:00Z",
    status: "SCHEDULED",
}

const course = (id: string): Course => ({
    id,
    code: id.toUpperCase(),
    name: `Course ${id}`,
    level: "basic",
    credits: 3,
    lessons: 10,
    category: "cat-1",
})

/** Titles of the cards currently on screen. */
const cardTitles = () => screen.queryAllByTestId("card").map((node) => node.textContent)

describe("CourseCatalog — term facet", () => {
    beforeEach(() => {
        askedTermId.mockClear()
        terms = [TERM]
        coursesByTerm = { "": [course("a")] }
    })

    it("says the term is empty instead of rendering a blank page", () => {
        render(<CourseCatalog />)
        expect(cardTitles()).toEqual(["Course a"])

        // the term exists in the dropdown but no course is attached to it yet
        fireEvent.click(screen.getByText("Kỳ Xuân 2027"))

        expect(cardTitles()).toEqual([])
        expect(screen.getByText("courseSystem.browse.termEmpty")).toBeTruthy()
    })

    it("offers a way out of the empty term, back to every course", () => {
        render(<CourseCatalog />)
        fireEvent.click(screen.getByText("Kỳ Xuân 2027"))

        fireEvent.click(screen.getByText("courseSystem.browse.filters.allTerms"))

        expect(cardTitles()).toEqual(["Course a"])
        expect(screen.queryByText("courseSystem.browse.termEmpty")).toBeNull()
    })

    it("keeps the plain 'no matching course' copy when nothing is filtered by term", () => {
        coursesByTerm = { "": [] }
        render(<CourseCatalog />)

        expect(screen.getByText("courseSystem.browse.empty")).toBeTruthy()
        expect(screen.queryByText("courseSystem.browse.filters.allTerms")).toBeNull()
    })

    it("drops the filter when the picked term leaves the list", () => {
        const { rerender } = render(<CourseCatalog />)
        fireEvent.click(screen.getByText("Kỳ Xuân 2027"))
        expect(askedTermId).toHaveBeenLastCalledWith(TERM.id)

        // the admin deletes the term: the dropdown unmounts, so a filter left behind
        // would empty the catalog with no control on screen to clear it
        terms = []
        rerender(<CourseCatalog />)

        expect(askedTermId).toHaveBeenLastCalledWith(undefined)
        expect(cardTitles()).toEqual(["Course a"])
        expect(screen.queryByTestId("term-picker")).toBeNull()
    })
})
