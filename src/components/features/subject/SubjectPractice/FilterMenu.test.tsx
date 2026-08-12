import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { FilterMenu } from "./FilterMenu"

/**
 * Component — what the {@link FilterMenu} TRIGGER says and how it is dressed.
 *
 * This is the whole reason the practice filters could shrink from four rows of pills
 * to one row of menus: with pills, every option is on screen, so the reader can always
 * see what is on. A menu hides them, and the trigger is the only thing left telling
 * the reader why the list in front of them is short. Get the label or the accent wrong
 * and the control is worse than the pills it replaced.
 *
 * The two shapes are deliberately different and are the cases below: a facet with an
 * OFF position (type, status) versus one without (sort).
 */

const TYPES = [
    { value: "all", label: "Mọi loại" },
    { value: "business", label: "Kinh doanh" },
] as const

/** Trigger element of the rendered menu (the popover content stays closed). */
const trigger = () => screen.getByRole("button")

describe("FilterMenu trigger", () => {
    it("parked on its off position: shows the facet NAME, plainly", () => {
        render(
            <FilterMenu
                label="Loại"
                options={TYPES}
                value="all"
                onChange={() => {}}
                neutralValue="all"
            />,
        )
        // "Mọi loại" belongs in the menu, not on the trigger: a filter that is off
        // should read as an unanswered question, not as an answer.
        expect(trigger().textContent).toContain("Loại")
        expect(trigger().textContent).not.toContain("Mọi loại")
        expect(trigger().className).toContain("border-separator")
        expect(trigger().className).not.toContain("border-accent")
    })

    it("narrowed: shows the PICKED label in accent, and names both halves", () => {
        render(
            <FilterMenu
                label="Loại"
                options={TYPES}
                value="business"
                onChange={() => {}}
                neutralValue="all"
            />,
        )
        expect(trigger().textContent).toContain("Kinh doanh")
        expect(trigger().className).toContain("border-accent")
        // WCAG 2.5.3: the accessible name must contain the visible text, or "click
        // Kinh doanh" matches nothing under voice control.
        expect(trigger().getAttribute("aria-label")).toBe("Loại: Kinh doanh")
    })

    it("no off position (sort): always shows its value and never takes the accent", () => {
        const sorts = [
            { value: "newest", label: "Mới nhất" },
            { value: "hot", label: "Hot" },
        ] as const
        render(
            <FilterMenu label="Sắp xếp" options={sorts} value="newest" onChange={() => {}} />,
        )
        // Sorting reorders, it never hides rows. Dressing it as an active filter would
        // send people hunting for a filter to clear that was never applied.
        expect(trigger().textContent).toContain("Mới nhất")
        expect(trigger().className).not.toContain("border-accent")
        expect(trigger().getAttribute("aria-label")).toBe("Sắp xếp: Mới nhất")
    })

    it("value with no matching option: falls back to the facet name, not a blank pill", () => {
        render(
            <FilterMenu
                label="Loại"
                options={TYPES}
                value={"gone" as "all"}
                onChange={() => {}}
                neutralValue="all"
            />,
        )
        // A stale value (an option removed while a pick was live) must not render an
        // empty trigger the reader cannot interpret or aim at.
        expect(trigger().textContent).toContain("Loại")
    })
})
