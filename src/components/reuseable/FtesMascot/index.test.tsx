import React from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { FtesMascot } from "./FtesMascot"
import { MascotBubble } from "./MascotBubble"
import type { MascotPose } from "./art"

/**
 * Unit tests for the mascot foundation (`onboarding-mascot-guide`). `next-intl`
 * and HeroUI's `cn` are mocked so the tests pin THIS component's contract — pose
 * rendering, the reduced-motion-safe idle bob toggle, the decorative-vs-named
 * a11y switch, and the bubble's live-region copy — without pulling the full UI
 * libraries into happy-dom. `t` echoes its key.
 */
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@heroui/react", () => ({
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
}))

const POSES: MascotPose[] = ["greeting", "explain", "point", "cheer"]

describe("FtesMascot", () => {
    it("renders each of the four poses as a distinct, decorative SVG", () => {
        for (const pose of POSES) {
            const { container, unmount } = render(<FtesMascot pose={pose} />)
            const root = container.querySelector(`[data-pose="${pose}"]`)
            expect(root).not.toBeNull()
            // one image per pose (the swappable FrosTES art in `./art`)
            expect(root?.querySelector("img")).not.toBeNull()
            // decorative by default → hidden from the a11y tree, no img role
            expect(root?.getAttribute("aria-hidden")).toBe("true")
            expect(root?.getAttribute("role")).toBeNull()
            unmount()
        }
    })

    it("applies the idle-bob class by default and drops it when animated=false", () => {
        const on = render(<FtesMascot pose="greeting" />)
        expect(on.container.querySelector(".mascot-bob")).not.toBeNull()
        on.unmount()

        const off = render(<FtesMascot pose="greeting" animated={false} />)
        expect(off.container.querySelector(".mascot-bob")).toBeNull()
    })

    it("exposes an accessible name when decorative is false", () => {
        const { container } = render(<FtesMascot pose="cheer" decorative={false} />)
        const root = container.querySelector("[data-pose=\"cheer\"]")
        expect(root?.getAttribute("role")).toBe("img")
        expect(root?.getAttribute("aria-label")).toBe("mascot.name")
        expect(root?.getAttribute("aria-hidden")).toBeNull()
    })
})

describe("MascotBubble", () => {
    it("shows the mascot plus title/body copy in a polite live region", () => {
        const { container, getByText } = render(
            <MascotBubble
                pose="explain"
                title="Welcome"
                actions={<button type="button">Next</button>}
            >
                Let me show you around
            </MascotBubble>,
        )
        expect(getByText("Welcome")).toBeTruthy()
        expect(getByText("Let me show you around")).toBeTruthy()
        expect(getByText("Next")).toBeTruthy()
        expect(container.querySelector("[aria-live=\"polite\"]")).not.toBeNull()
        // the mascot rides along, decorative
        expect(container.querySelector("[data-pose=\"explain\"]")).not.toBeNull()
    })
})
