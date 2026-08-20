/**
 * Component — the term control of {@link FacetSortBar} obeys the bar's existing rule
 * for OPTIONAL facets: it renders only when BOTH the value slot and the handler are
 * passed (same contract as `level` / `minRating`), so `/courses` gains a facet while
 * every other page using this bar keeps the plain search + sort row.
 *
 * The picker itself is mocked — its behaviour belongs to `TermFilterDropdown`; what is
 * pinned here is the bar's render gate and the props it forwards.
 */
import React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import type { PublicTermView } from "@/modules/api/rest/course"

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@heroui/react", () => ({
    cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
}))

vi.mock("@phosphor-icons/react", () => ({
    StarIcon: () => <span />,
}))

vi.mock("@/components/reuseable/SearchInput", () => ({
    SearchInput: () => <input aria-label="search" />,
}))

vi.mock("@/components/blocks/navigation/SegmentedControl", () => ({
    SegmentedControl: ({ ariaLabel }: { ariaLabel: string }) => <div data-testid={ariaLabel} />,
}))

vi.mock("../../TermFilterDropdown", () => ({
    TermFilterDropdown: ({ options, allLabel }: {
        options: Array<{ id: string, label: string }>
        allLabel: string
    }) => (
        <div data-testid="term-picker" data-all={allLabel}>
            {options.map((option) => (
                <span key={option.id} data-testid={`term-${option.id}`}>{option.label}</span>
            ))}
        </div>
    ),
}))

import { FacetSortBar } from "./index"

const TERMS: Array<PublicTermView> = [
    {
        id: "t-fall",
        code: "FA26",
        name: "Kỳ Thu 2026",
        startsAt: "2026-09-01T00:00:00Z",
        endsAt: "2026-12-31T00:00:00Z",
        status: "ACTIVE",
    },
    {
        id: "t-spring",
        code: "SP26",
        name: "Kỳ Xuân 2026",
        startsAt: "2026-01-01T00:00:00Z",
        endsAt: "2026-05-31T00:00:00Z",
        status: "ENDED",
    },
]

/** The two props every caller of the bar passes. */
const base = {
    query: "",
    onQueryChange: () => {},
    sort: "popular" as const,
    onSortChange: () => {},
}

describe("FacetSortBar — term facet", () => {
    it("renders no term control when the props are not passed", () => {
        render(<FacetSortBar {...base} />)
        expect(screen.queryByTestId("term-picker")).toBeNull()
    })

    it("renders no term control when the handler is missing", () => {
        render(<FacetSortBar {...base} terms={TERMS} />)
        expect(screen.queryByTestId("term-picker")).toBeNull()
    })

    it("renders no term control when there is no term at all", () => {
        render(<FacetSortBar {...base} terms={[]} onTermChange={() => {}} />)
        expect(screen.queryByTestId("term-picker")).toBeNull()
    })

    it("renders one option per term, plus an 'all terms' default", () => {
        render(<FacetSortBar {...base} terms={TERMS} onTermChange={() => {}} />)
        const picker = screen.getByTestId("term-picker")
        expect(picker.getAttribute("data-all")).toBe("courseSystem.browse.filters.allTerms")
        expect(screen.getByTestId("term-t-fall").textContent).toBe("Kỳ Thu 2026")
        expect(screen.getByTestId("term-t-spring").textContent).toBe("Kỳ Xuân 2026")
    })

    it("keeps the sort control pinned regardless of the term facet", () => {
        render(<FacetSortBar {...base} terms={TERMS} onTermChange={() => {}} />)
        expect(screen.getByTestId("courseSystem.browse.sortLabel")).toBeTruthy()
    })
})
