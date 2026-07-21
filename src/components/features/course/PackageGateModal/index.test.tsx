import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Component — the shared paywall gate modal.
 *
 * Regression: a LEGACY course has NO packages by design (the BE forbids them), so the gate
 * showed "no matching packages / packages are being updated" and the viewer could not buy
 * anything — the enroll CTA on a locked lesson was a dead end with no payment step. The gate
 * must fall back to the course-level COURSE_UNLOCK product.
 */

const packagesMock = vi.fn()
const courseProductMock = vi.fn()

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, params?: Record<string, unknown>) =>
        params ? `${key}:${JSON.stringify(params)}` : key,
}))

vi.mock("@phosphor-icons/react", () => ({ CheckIcon: () => <span />, LockSimpleIcon: () => <span /> }))

vi.mock("@heroui/react", () => {
    const Modal = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Backdrop = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Container = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Dialog = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Header = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Body = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Footer = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    return {
        Modal,
        Button: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
        Chip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        Skeleton: () => <div />,
        Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
    }
})

vi.mock("@/modules/api/rest/commerce", () => ({ isPaidOrderStatus: () => true }))
vi.mock("@/hooks/swr/api/rest/queries/useGetCourseProductSwr", () => ({
    useGetCourseProductSwr: () => courseProductMock(),
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetCoursePackageProductSwr", () => ({
    useGetCoursePackageProductSwr: () => ({ data: undefined }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostAddCartItemSwr", () => ({
    usePostAddCartItemSwr: () => ({ trigger: vi.fn(), isMutating: false }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostCheckoutSwr", () => ({
    usePostCheckoutSwr: () => ({ trigger: vi.fn(), isMutating: false }),
}))
vi.mock("@/hooks/zustand/overlay/hooks", () => ({ usePaymentOverlayState: () => ({ open: vi.fn() }) }))
vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({ guard: (fn: () => void) => fn }),
}))
vi.mock("@/components/features/course/hooks/useQueryCoursePackagesSwr", () => ({
    useQueryCoursePackagesSwr: () => packagesMock(),
}))

import { PackageGateModal } from "./index"

const props = {
    isOpen: true,
    onClose: vi.fn(),
    courseId: "khoa-a",
    courseRawId: "uuid-a",
    courseTitle: "WED201c",
    lessonId: "l1",
    lessonTitle: "Tài Liệu",
    packageSlugs: [] as Array<string>,
    context: "document" as const,
}

describe("PackageGateModal — course with no packages (LEGACY)", () => {
    it("offers the whole course when the course sells no packages", () => {
        packagesMock.mockReturnValue({ packages: [], isLoading: false, isError: false })
        courseProductMock.mockReturnValue({
            data: { id: "p1", priceVnd: 399000, priceCoin: null },
            isLoading: false,
        })
        render(<PackageGateModal {...props} />)
        expect(screen.getByText("detail.wholeCourse")).toBeTruthy()
        expect(screen.getByText("detail.enroll")).toBeTruthy()
        // the old dead end must be gone
        expect(screen.queryByText("modal.emptyTitle")).toBeNull()
    })

    /**
     * A package priced at 0 (slug ≠ the platform's own "free" tier) used to be filtered
     * out by `salePrice > 0`, so the viewer was offered the PAID whole course while a free
     * package already unlocked the lesson. Real data: `goi-prf192prf193` ships an ACTIVE
     * package priced 0.
     */
    it("lists a FREE package that unlocks the lesson instead of upselling the whole course", () => {
        packagesMock.mockReturnValue({
            packages: [
                {
                    id: "pkg-free",
                    slug: "goi-tang-kem",
                    name: "Gói tặng kèm",
                    salePrice: 0,
                    originalPrice: 0,
                    sortOrder: 1,
                    descriptions: "",
                    entitlements: [],
                },
            ],
            isLoading: false,
            isError: false,
        })
        courseProductMock.mockReturnValue({
            data: { id: "p1", priceVnd: 399000, priceCoin: null },
            isLoading: false,
        })
        render(<PackageGateModal {...props} packageSlugs={["goi-tang-kem"]} />)
        expect(screen.getByText("Gói tặng kèm")).toBeTruthy()
        // the paid whole-course fallback must NOT take over
        expect(screen.queryByText("detail.wholeCourse")).toBeNull()
    })

    it("keeps the empty message only when the course carries no product either", () => {
        packagesMock.mockReturnValue({ packages: [], isLoading: false, isError: false })
        courseProductMock.mockReturnValue({ data: null, isLoading: false })
        render(<PackageGateModal {...props} />)
        expect(screen.getByText("modal.emptyTitle")).toBeTruthy()
        expect(screen.queryByText("detail.enroll")).toBeNull()
    })
})
