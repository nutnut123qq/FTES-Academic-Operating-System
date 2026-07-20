import React from "react"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the navbar's single-source Ctrl/Cmd+K handler (change
 * `fe-starci-ui-refinements`, capability `search-command-palette`). The shortcut is
 * registered in exactly one place (the navbar container) and always opens the centered
 * search command palette, on every viewport — it never focuses an inline field (the
 * inline dropdown was retired). It is suppressed while a FOREIGN overlay is on top.
 *
 * Every child is a passthrough mock so the container renders in happy-dom.
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
}))

vi.mock("./Logo", () => ({ Logo: () => <div /> }))
vi.mock("./HeaderNav", () => ({ HeaderNav: () => <nav /> }))
vi.mock("./AccountMenuDropdown", () => ({ AccountMenuDropdown: () => <div /> }))
vi.mock("./NotificationBell", () => ({ NotificationBell: () => <div /> }))
vi.mock("./CartButton", () => ({ CartButton: () => <div /> }))
vi.mock("./LanguageDropdown", () => ({ LanguageDropdown: () => <div /> }))

vi.mock("./SearchInline", () => ({
    SearchInline: () => <div data-testid="search-trigger" />,
}))

vi.mock("@phosphor-icons/react", () => {
    const Icon = (props: Record<string, unknown>) => <svg {...props} />
    return { SidebarSimpleIcon: Icon, MagnifyingGlassIcon: Icon, NewspaperIcon: Icon }
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
    it("opens the search command palette on Ctrl+K", () => {
        render(<Navbar />)
        fireEvent.keyDown(window, { key: "k", ctrlKey: true })
        expect(h.openSearch).toHaveBeenCalledTimes(1)
    })

    it("opens the search command palette on Cmd+K", () => {
        render(<Navbar />)
        fireEvent.keyDown(window, { key: "k", metaKey: true })
        expect(h.openSearch).toHaveBeenCalledTimes(1)
    })

    it("ignores plain 'k' without a modifier", () => {
        render(<Navbar />)
        fireEvent.keyDown(window, { key: "k" })
        expect(h.openSearch).not.toHaveBeenCalled()
    })

    it("skips the shortcut while a foreign overlay (modal/drawer) is open", () => {
        render(<Navbar />)
        // simulate an unrelated dialog on top (auth/confirm) — NOT the search overlay
        const foreign = document.createElement("div")
        foreign.className = "modal__dialog"
        document.body.appendChild(foreign)
        try {
            fireEvent.keyDown(window, { key: "k", ctrlKey: true })
            expect(h.openSearch).not.toHaveBeenCalled()
        } finally {
            document.body.removeChild(foreign)
        }
    })
})
