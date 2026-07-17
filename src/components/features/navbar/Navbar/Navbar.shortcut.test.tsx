import React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the navbar's single-source Ctrl/Cmd+K handler (change
 * `blog-nav-and-engagement`, task 4.5). The shortcut is registered in exactly one
 * place (the navbar container): at or above `md` it focuses the inline search field;
 * below `md` — where the inline field is hidden and the full-screen overlay is the
 * search surface — it opens the overlay instead. `window.matchMedia` is stubbed per
 * test to pick the viewport branch.
 *
 * Every child is a passthrough mock so the container renders in happy-dom; the mocked
 * `SearchInline` attaches the forwarded ref to a real `<input>` so we can assert focus.
 */

const h = vi.hoisted(() => ({
    openSearch: vi.fn(),
    matches: true,
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@/i18n/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/components/features/app-shell/useAppNav", () => ({
    useAppNav: () => [],
}))

vi.mock("@/hooks/zustand/navbarBottomLayer/store", () => ({
    useNavbarBottomLayerStore: (selector: (state: unknown) => unknown) => selector({ bottomLayer: null }),
}))

vi.mock("@/hooks/zustand/overlay/hooks", () => ({
    useSearchOverlayState: () => ({ open: h.openSearch }),
    useAppearanceOverlayState: () => ({ open: vi.fn() }),
}))

vi.mock("./Logo", () => ({ Logo: () => <div /> }))
vi.mock("./HeaderNav", () => ({ HeaderNav: () => <nav /> }))
vi.mock("./AccountMenuDropdown", () => ({ AccountMenuDropdown: () => <div /> }))
vi.mock("./NotificationBell", () => ({ NotificationBell: () => <div /> }))
vi.mock("./CartButton", () => ({ CartButton: () => <div /> }))
vi.mock("./LanguageDropdown", () => ({ LanguageDropdown: () => <div /> }))

vi.mock("./SearchInline", () => ({
    SearchInline: ({ inputRef }: { inputRef?: React.RefObject<HTMLInputElement | null> }) => (
        <input ref={inputRef} data-testid="inline-input" />
    ),
}))

vi.mock("@phosphor-icons/react", () => {
    const Icon = (props: Record<string, unknown>) => <svg {...props} />
    return { SidebarSimpleIcon: Icon, MagnifyingGlassIcon: Icon, PaletteIcon: Icon, NewspaperIcon: Icon }
})

vi.mock("@heroui/react", () => {
    const Button = ({
        children,
        onPress,
        ...rest
    }: {
        children?: React.ReactNode
        onPress?: () => void
        [k: string]: unknown
    }) => {
        const { isIconOnly, variant, fullWidth, ...dom } = rest
        void isIconOnly
        void variant
        void fullWidth
        return (
            <button type="button" onClick={onPress} {...dom}>
                {children}
            </button>
        )
    }
    const passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    const Drawer = Object.assign(passthrough, {
        Backdrop: passthrough,
        Content: passthrough,
        Dialog: passthrough,
        CloseTrigger: () => <div />,
        Header: passthrough,
        Heading: passthrough,
        Body: passthrough,
    })
    const Typography = passthrough
    const cn = (...args: Array<unknown>) => args.filter(Boolean).join(" ")
    return { Button, Drawer, Typography, cn }
})

import { Navbar } from "./index"

beforeEach(() => {
    h.openSearch.mockReset()
    h.matches = true
    vi.stubGlobal(
        "matchMedia",
        vi.fn((query: string) => ({
            matches: h.matches,
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
            onchange: null,
        })),
    )
})

afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
})

describe("Navbar — Ctrl/Cmd+K single source", () => {
    it("focuses the inline field on desktop (≥ md) and does NOT open the overlay", () => {
        h.matches = true
        render(<Navbar />)
        fireEvent.keyDown(window, { key: "k", ctrlKey: true })
        expect(document.activeElement).toBe(screen.getByTestId("inline-input"))
        expect(h.openSearch).not.toHaveBeenCalled()
    })

    it("opens the overlay below md instead of focusing the (hidden) inline field", () => {
        h.matches = false
        render(<Navbar />)
        fireEvent.keyDown(window, { key: "k", metaKey: true })
        expect(h.openSearch).toHaveBeenCalledTimes(1)
        expect(document.activeElement).not.toBe(screen.getByTestId("inline-input"))
    })

    it("ignores plain 'k' without a modifier", () => {
        render(<Navbar />)
        fireEvent.keyDown(window, { key: "k" })
        expect(h.openSearch).not.toHaveBeenCalled()
    })

    it("skips the shortcut while a foreign overlay (modal/drawer) is open", () => {
        h.matches = false
        render(<Navbar />)
        // simulate an unrelated dialog on top (auth/confirm) — NOT the search overlay
        const foreign = document.createElement("div")
        foreign.className = "modal__dialog"
        document.body.appendChild(foreign)
        try {
            fireEvent.keyDown(window, { key: "k", ctrlKey: true })
            expect(h.openSearch).not.toHaveBeenCalled()
            expect(document.activeElement).not.toBe(screen.getByTestId("inline-input"))
        } finally {
            document.body.removeChild(foreign)
        }
    })
})
