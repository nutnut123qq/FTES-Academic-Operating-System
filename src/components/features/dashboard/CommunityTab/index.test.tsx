import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Pins the SECTION ORDER of the MY RESOURCE panel: Saved above My posts.
 *
 * The two sections are one line apart in the JSX, so a refactor or a merge can flip them
 * back without anyone noticing — and the failure mode is silent (both sections still
 * render, they are just in the order that buried the saved shelf below a long post list).
 * Both children are stubbed: this asserts placement only, never their contents.
 */

vi.mock("@heroui/react", () => ({
    cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
}))
vi.mock("./MyPosts", () => ({ MyPosts: () => <div data-testid="section">my-posts</div> }))
vi.mock("./SavedSection", () => ({ SavedSection: () => <div data-testid="section">saved</div> }))

import { CommunityTab } from "./index"

describe("CommunityTab section order", () => {
    it("renders Saved above My posts", () => {
        render(<CommunityTab />)

        expect(screen.getAllByTestId("section").map((node) => node.textContent)).toEqual([
            "saved",
            "my-posts",
        ])
    })
})
