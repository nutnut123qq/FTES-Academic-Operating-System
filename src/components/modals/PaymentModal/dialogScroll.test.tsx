import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Regression — "giỏ hàng dài quá thì k nhấn được thanh toán".
 *
 * With a full cart the checkout dialog grew past the viewport and the primary action fell
 * below the fold with NOTHING scrolling, so the buyer could not pay at all. Measured on the
 * pre-fix build at 1280×700 with 5 courses: dialog 797px tall in a 700px viewport, CTA at
 * y=761–799 (off-screen), `modal-body` not scrollable.
 *
 * The shape that fixes it, pinned here so it cannot silently regress:
 *  1. `Modal.Dialog` caps at the viewport (`max-h-full`) and may shrink (`min-h-0`) — a flex
 *     item will NOT go below its content height without the latter, which is the classic way
 *     this fix quietly does nothing.
 *  2. `Modal.Body` is a `min-h-0 flex-1` column, and the ONE scroll region is a `ScrollShadow`
 *     carrying `min-h-0 flex-1 overflow-y-auto` (the same primitive as `OutlineRail` and the
 *     course purchase card).
 *  3. The Summary step's CTA lives in `Modal.Footer`, i.e. a SIBLING of the body — pinned
 *     outside the scroll region so a long cart can never bury it.
 *
 * The mocks below are deliberately PASS-THROUGH (they forward `className` onto real DOM and
 * keep `data-slot`), because the class strings and the body/footer boundary ARE the contract
 * under test.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useFormatter: () => ({ number: (n: number) => String(n) }),
}))

vi.mock("@phosphor-icons/react", () => ({
    ArrowLeftIcon: () => <span />,
    ArrowRightIcon: () => <span />,
    BankIcon: () => <span />,
    ClockIcon: () => <span />,
    CoinsIcon: () => <span />,
    WalletIcon: () => <span />,
    XCircleIcon: () => <span />,
}))

vi.mock("@heroui/react", () => {
    type P = { children?: React.ReactNode; className?: string }
    const slot = (name: string) =>
        ({ children, className }: P) => (
            <div data-slot={name} className={className}>
                {children}
            </div>
        )
    const Modal = Object.assign(
        ({ children, isOpen }: P & { isOpen?: boolean }) => (isOpen === false ? null : <div>{children}</div>),
        {
            Backdrop: slot("modal-backdrop"),
            Container: slot("modal-container"),
            Dialog: slot("modal-dialog"),
            Header: slot("modal-header"),
            Body: slot("modal-body"),
            Footer: slot("modal-footer"),
            CloseTrigger: () => <button type="button" aria-label="close" />,
        },
    )
    const Chip = Object.assign(({ children }: P) => <span>{children}</span>, {
        Label: ({ children }: P) => <span>{children}</span>,
    })
    return {
        Modal,
        Chip,
        // Pass-through: `ScrollShadow` must keep its className, that IS the assertion.
        ScrollShadow: ({ children, className }: P) => (
            <div data-testid="scroll-region" className={className}>
                {children}
            </div>
        ),
        Button: ({ children, onPress }: P & { onPress?: () => void }) => (
            <button type="button" onClick={onPress}>
                {children}
            </button>
        ),
        Input: (props: Record<string, unknown>) => <input {...props} />,
        Label: ({ children }: P) => <label>{children}</label>,
        TextField: ({ children }: P) => <div>{children}</div>,
        Typography: ({ children, className }: P) => <span className={className}>{children}</span>,
        cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
    }
})

vi.mock("@/components/blocks/media/CoverImage", () => ({ CoverImage: () => <div /> }))
vi.mock("@/components/blocks/commerce/PriceTag", () => ({ PriceTag: () => <div /> }))
vi.mock("@/components/reuseable/FtesMascot", () => ({ MascotBubble: () => <div /> }))
vi.mock("@/components/reuseable/QRCode", () => ({ QRCode: () => <div /> }))
vi.mock("@/modules/api/rest/commerce", () => ({ isPaidOrderStatus: () => false }))
vi.mock("@/modules/api/rest/client", () => ({ RestError: class extends Error {} }))

vi.mock("swr", () => ({ useSWRConfig: () => ({ mutate: vi.fn() }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

/** Five courses — the cart size the owner reproduced the dead CTA with. */
const lines = Array.from({ length: 5 }, (_, i) => ({
    id: `line-${i}`,
    name: `Khoá học số ${i + 1}`,
    priceVnd: 499000,
    originalPriceVnd: 799000,
    imageUrl: null,
}))

vi.mock("@/hooks/zustand/overlay/hooks", () => ({
    usePaymentOverlayState: () => ({
        isOpen: true,
        setOpen: vi.fn(),
        open: vi.fn(),
        context: {
            itemIds: lines.map((l) => l.id),
            lines,
            title: "Giỏ hàng (5 sản phẩm)",
            amountVnd: 2495000,
            originalAmountVnd: 3995000,
        },
    }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostCheckoutSwr", () => ({
    usePostCheckoutSwr: () => ({ trigger: vi.fn(), isMutating: false }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostValidateCouponSwr", () => ({
    usePostValidateCouponSwr: () => ({ trigger: vi.fn(), isMutating: false }),
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetMyWalletSwr", () => ({
    useGetMyWalletSwr: () => ({ data: { balance: 0 }, mutate: vi.fn() }),
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetCoinQuoteSwr", () => ({
    useGetCoinQuoteSwr: () => ({ data: undefined, isLoading: false }),
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetOrderSwr", () => ({
    useGetOrderSwr: () => ({ data: undefined }),
}))

import { PaymentModal } from "./index"

const classesOf = (el: Element | null) => (el?.getAttribute("class") ?? "").split(/\s+/)

describe("PaymentModal — long cart must never bury the pay button", () => {
    it("caps the dialog at the viewport and lets it shrink", () => {
        const { container } = render(<PaymentModal />)
        const dialog = container.querySelector("[data-slot=modal-dialog]")
        expect(dialog).not.toBeNull()
        const cls = classesOf(dialog)
        // the height cap — without it the dialog just keeps growing past the screen
        expect(cls).toContain("max-h-full")
        // load-bearing: a flex item will not shrink below its content without this
        expect(cls).toContain("min-h-0")
    })

    it("makes the body a shrinkable flex column that owns no scrolling itself", () => {
        const { container } = render(<PaymentModal />)
        const cls = classesOf(container.querySelector("[data-slot=modal-body]"))
        expect(cls).toContain("min-h-0")
        expect(cls).toContain("flex-1")
        expect(cls).toContain("flex-col")
    })

    it("routes overflow through the shared ScrollShadow scroll region", () => {
        render(<PaymentModal />)
        const cls = classesOf(screen.getByTestId("scroll-region"))
        expect(cls).toContain("overflow-y-auto")
        // same trio as OutlineRail / the course purchase card
        expect(cls).toContain("min-h-0")
        expect(cls).toContain("flex-1")
        // NO negative inline margin: the body is itself a scroll container, so a child
        // wider than it produces a horizontal scrollbar that steals 10px of height and
        // shifts even a 1-item cart (measured).
        expect(cls.some((c) => c.startsWith("-mx-"))).toBe(false)
    })

    it("pins the Summary CTA in the footer, OUTSIDE the scroll region", () => {
        const { container } = render(<PaymentModal />)
        const footer = container.querySelector("[data-slot=modal-footer]")
        expect(footer).not.toBeNull()
        // the action itself lives in the footer…
        expect(footer?.textContent).toContain("checkout.continueToPayment")
        // …and NOT inside the scrolling area
        expect(screen.getByTestId("scroll-region").textContent).not.toContain(
            "checkout.continueToPayment",
        )
        // footer is a SIBLING of the body, never nested in it
        expect(container.querySelector("[data-slot=modal-body]")?.contains(footer!)).toBe(false)
    })

    it("still renders every order line inside the scroll region", () => {
        render(<PaymentModal />)
        const region = screen.getByTestId("scroll-region")
        lines.forEach((l) => expect(region.textContent).toContain(l.name))
    })
})
