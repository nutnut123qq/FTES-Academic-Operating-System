import React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — {@link SearchInline}, the desktop navbar search trigger (change
 * `fe-starci-ui-refinements`, capability `search-command-palette`). The inline
 * results dropdown was retired: the trigger is now a plain field-shaped button that
 * OPENS the centered command palette on press. Asserts pressing it opens the search
 * overlay singleton. Collaborators are mocked so it renders in happy-dom without the
 * HeroUI theme or Zustand.
 */

const h = vi.hoisted(() => ({
    openSearch: vi.fn(),
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@/hooks/zustand/overlay/hooks", () => ({
    useSearchOverlayState: () => ({ open: h.openSearch }),
}))

vi.mock("@phosphor-icons/react", () => ({
    MagnifyingGlassIcon: (props: Record<string, unknown>) => <svg data-testid="mag" {...props} />,
}))

vi.mock("@heroui/react", () => {
    const Kbd = ({ children }: { children?: React.ReactNode }) => <kbd>{children}</kbd>
    Object.assign(Kbd, { Content: ({ children }: { children?: React.ReactNode }) => <span>{children}</span> })
    return { Kbd }
})

// The block is exercised via a thin double surfacing its press handler + aria label.
vi.mock("@/components/blocks/buttons/InputButtonLike", () => ({
    InputButtonLike: ({ placeholder, onPress }: { placeholder: React.ReactNode; onPress: () => void }) => (
        <button type="button" onClick={onPress}>
            {placeholder}
        </button>
    ),
}))

import { SearchInline } from "./index"

afterEach(() => cleanup())

describe("SearchInline — command-palette trigger", () => {
    it("opens the search overlay when pressed", () => {
        render(<SearchInline />)
        fireEvent.click(screen.getByRole("button"))
        expect(h.openSearch).toHaveBeenCalledTimes(1)
    })
})
