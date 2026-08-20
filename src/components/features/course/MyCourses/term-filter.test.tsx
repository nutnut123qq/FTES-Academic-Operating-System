/**
 * Component — the term filter of `/courses/me` (`course-term-filter-and-my-courses-entry`
 * task 3). Filtering here is CLIENT-side over data already on each enrollment row, so
 * the cases that matter are the grouping rules, not a fetch:
 *  - the option list is built from the viewer's OWN courses, never the whole term catalog,
 *  - a course outside every term ("Ngoài kỳ học") is a selectable group, not a hidden row,
 *  - a term whose row was deleted (`termId` set, `termName` null) still gets a group with
 *    a fallback label — that enrollment must not fall out of every choice,
 *  - one group only = no filter at all (a single choice is not a filter),
 *  - filtering to zero shows filter-specific copy, NOT "you haven't enrolled in anything".
 *
 * `t` echoes the key, so assertions read against `courses.mine.*`.
 */
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import type { MyCourse } from "../hooks/useQueryMyCoursesSwr"

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useFormatter: () => ({ dateTime: () => "01/01/2026" }),
}))

vi.mock("@/i18n/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}))

let courses: Array<MyCourse>
vi.mock("../hooks/useQueryMyCoursesSwr", () => ({
    useQueryMyCoursesSwr: () => ({
        courses,
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
    }),
}))

// AsyncContent: only the empty branch matters here (loading/error are never entered).
vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ isEmpty, children }: { isEmpty?: boolean, children: React.ReactNode }) =>
        (isEmpty ? <div data-testid="no-enrollments" /> : <>{children}</>),
}))

vi.mock("@/components/blocks/async/EmptyContent", () => ({
    EmptyContent: ({ title }: { title: React.ReactNode }) => <div data-testid="empty">{title}</div>,
}))

vi.mock("@/components/features/course/ContinueCourseCard", () => ({
    ContinueCourseCard: ({ title }: { title: string }) => <div data-testid="card">{title}</div>,
}))

vi.mock("@/components/blocks/skeleton/Skeleton", () => ({ Skeleton: () => <div /> }))
vi.mock("@/components/reuseable/FtesMascot", () => ({ FtesMascot: () => <span /> }))
vi.mock("@/components/features/mascot-moments", () => ({ MascotProfileNudge: () => null }))

vi.mock("@heroui/react", () => ({
    Button: ({ children, onPress }: { children: React.ReactNode, onPress?: () => void }) => (
        <button type="button" onClick={onPress}>{children}</button>
    ),
    Chip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

// The picker is exercised through its props: each option becomes a button, so a test
// can "pick" a term without dragging a real popover into happy-dom.
vi.mock("../TermFilterDropdown", () => ({
    TermFilterDropdown: ({ options, value, onChange, allLabel }: {
        options: Array<{ id: string, label: string }>
        value?: string
        onChange: (next: string | undefined) => void
        allLabel: string
    }) => (
        <div data-testid="term-picker" data-value={value ?? ""}>
            <button type="button" onClick={() => onChange(undefined)}>{allLabel}</button>
            {options.map((option) => (
                <button key={option.id} type="button" onClick={() => onChange(option.id)}>
                    {option.label}
                </button>
            ))}
        </div>
    ),
}))

import { MyCourses } from "./index"

/** One enrolled course row; `termId`/`termName` default to "outside any term". */
const course = (over: Partial<MyCourse> & { courseId: string }): MyCourse => ({
    title: `Course ${over.courseId}`,
    slug: over.courseId,
    completionPercent: 10,
    href: `/courses/${over.courseId}/learn`,
    isPurchased: true,
    coverImage: null,
    accessUntil: null,
    expired: false,
    termId: null,
    termName: null,
    ...over,
})

/** Titles of the cards currently on screen. */
const cardTitles = () => screen.queryAllByTestId("card").map((node) => node.textContent)

describe("MyCourses — term filter", () => {
    beforeEach(() => {
        courses = []
    })

    it("does not render the filter when every course sits in the same group", () => {
        courses = [
            course({ courseId: "a", termId: "t1", termName: "Kỳ Thu" }),
            course({ courseId: "b", termId: "t1", termName: "Kỳ Thu" }),
        ]
        render(<MyCourses />)
        expect(screen.queryByTestId("term-picker")).toBeNull()
        expect(cardTitles()).toHaveLength(2)
    })

    it("lists one option per distinct term, plus 'Ngoài kỳ học' last", () => {
        courses = [
            course({ courseId: "a", termId: "t1", termName: "Kỳ Thu" }),
            course({ courseId: "b", termId: "t1", termName: "Kỳ Thu" }),
            course({ courseId: "c", termId: "t2", termName: "Kỳ Xuân" }),
            course({ courseId: "d" }),
        ]
        render(<MyCourses />)
        const picker = screen.getByTestId("term-picker")
        const labels = [...picker.querySelectorAll("button")].map((node) => node.textContent)
        expect(labels).toEqual([
            "courses.mine.termAll",
            "Kỳ Thu",
            "Kỳ Xuân",
            "courses.mine.termNone",
        ])
    })

    it("shows every course under the default 'all terms' choice", () => {
        courses = [
            course({ courseId: "a", termId: "t1", termName: "Kỳ Thu" }),
            course({ courseId: "b" }),
        ]
        render(<MyCourses />)
        expect(cardTitles()).toEqual(["Course a", "Course b"])
    })

    it("narrows the grid to the picked term, and back", () => {
        courses = [
            course({ courseId: "a", termId: "t1", termName: "Kỳ Thu" }),
            course({ courseId: "b", termId: "t2", termName: "Kỳ Xuân" }),
            course({ courseId: "c" }),
        ]
        render(<MyCourses />)
        fireEvent.click(screen.getByText("Kỳ Thu"))
        expect(cardTitles()).toEqual(["Course a"])
        fireEvent.click(screen.getByText("courses.mine.termAll"))
        expect(cardTitles()).toEqual(["Course a", "Course b", "Course c"])
    })

    it("keeps term-less courses reachable through their own group", () => {
        courses = [
            course({ courseId: "a", termId: "t1", termName: "Kỳ Thu" }),
            course({ courseId: "b" }),
        ]
        render(<MyCourses />)
        fireEvent.click(screen.getByText("courses.mine.termNone"))
        expect(cardTitles()).toEqual(["Course b"])
    })

    it("keeps a deleted term selectable under a fallback label", () => {
        courses = [
            course({ courseId: "a", termId: "gone", termName: null }),
            course({ courseId: "b", termId: "t1", termName: "Kỳ Thu" }),
        ]
        render(<MyCourses />)
        fireEvent.click(screen.getByText("courses.mine.termUnknown"))
        expect(cardTitles()).toEqual(["Course a"])
    })

    it("says the filter emptied the grid — not that nothing is enrolled", () => {
        courses = [
            course({ courseId: "a", termId: "t1", termName: "Kỳ Thu" }),
            course({ courseId: "b", termId: "t2", termName: "Kỳ Xuân" }),
            course({ courseId: "c", termId: "t3", termName: "Kỳ Hè" }),
        ]
        const { rerender } = render(<MyCourses />)
        fireEvent.click(screen.getByText("Kỳ Thu"))
        expect(cardTitles()).toEqual(["Course a"])

        // the picked term's last course leaves the list (unenrolled / revalidated away)
        // while the selection stays: the grid empties, but the viewer IS still enrolled
        courses = [
            course({ courseId: "b", termId: "t2", termName: "Kỳ Xuân" }),
            course({ courseId: "c", termId: "t3", termName: "Kỳ Hè" }),
        ]
        rerender(<MyCourses />)

        expect(cardTitles()).toEqual([])
        // the filter-specific copy, NOT the onboarding "you haven't enrolled" branch
        expect(screen.getByTestId("empty").textContent).toBe("courses.mine.filterEmpty")
        expect(screen.queryByTestId("no-enrollments")).toBeNull()
        // and the picker is still on screen, so the filter can be cleared
        expect(screen.getByTestId("term-picker")).toBeTruthy()
    })

    it("shows no filter-empty state while the grid still has cards", () => {
        courses = [
            course({ courseId: "a", termId: "t1", termName: "Kỳ Thu" }),
            course({ courseId: "b", termId: "t2", termName: "Kỳ Xuân" }),
        ]
        render(<MyCourses />)
        fireEvent.click(screen.getByText("Kỳ Thu"))
        expect(cardTitles()).toEqual(["Course a"])
        expect(screen.queryByTestId("empty")).toBeNull()
    })
})
