import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * Hook — the course detail enrollment intent (change `course-enroll-cta-must-complete`).
 *
 * Regression: with no resolvable COURSE_UNLOCK product, `onEnroll` used to
 * `router.push(detailHref)` — the URL of the page the CTA lives on. The button "worked"
 * and nothing happened. The hook must instead report `canBuy: false` (so the CTA is
 * disabled) and perform NO navigation.
 */

const push = vi.fn()
const productMock = vi.fn()
const mockPaymentOpen = vi.fn()

vi.mock("next-intl", () => ({ useLocale: () => "vi" }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("swr", () => ({ useSWRConfig: () => ({ mutate: vi.fn() }) }))
vi.mock("@/hooks/swr/api/graphql/mutations/useMutateStartTrialSwr", () => ({
    useMutateStartTrialSwr: () => ({ trigger: vi.fn() }),
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetCourseProductSwr", () => ({
    useGetCourseProductSwr: () => productMock(),
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetCartSwr", () => ({
    useGetCartSwr: () => ({ data: undefined }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostAddCartItemSwr", () => ({
    // Resolves a real cart item so the buy path reaches `payment.open` instead of
    // throwing on `item.id` and being swallowed by the hook's catch.
    usePostAddCartItemSwr: () => ({ trigger: vi.fn().mockResolvedValue({ id: "item1" }), isMutating: false }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostRemoveCartItemSwr", () => ({
    usePostRemoveCartItemSwr: () => ({ trigger: vi.fn(), isMutating: false }),
}))
vi.mock("@/hooks/zustand/overlay/hooks", () => ({ usePaymentOverlayState: () => ({ open: mockPaymentOpen }) }))
vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({ guard: (fn: () => unknown) => fn }),
}))
vi.mock("@/redux/hooks", () => ({ useAppSelector: () => false }))

import { useCourseEnrollment } from "./useCourseEnrollment"

describe("useCourseEnrollment", () => {
    it("reports canBuy false and navigates nowhere when the product is unresolved", async () => {
        push.mockClear()
        productMock.mockReturnValue({ data: null, isLoading: false })
        const { result } = renderHook(() =>
            useCourseEnrollment("khoa-a", { isEnrolled: false }, { rawId: "uuid-a", title: "Khóa A" }),
        )
        expect(result.current.canBuy).toBe(false)
        await act(async () => {
            await result.current.onEnroll()
        })
        expect(push).not.toHaveBeenCalled()
    })

    it("reports canBuy true once the product resolves", () => {
        productMock.mockReturnValue({ data: { id: "p1", priceVnd: 399000 }, isLoading: false })
        const { result } = renderHook(() =>
            useCourseEnrollment("khoa-a", { isEnrolled: false }, { rawId: "uuid-a", title: "Khóa A" }),
        )
        expect(result.current.canBuy).toBe(true)
    })

    /**
     * Regression: the checkout modal refreshes the cart and the wallet by itself, but the
     * page that OPENED it was never told. A buyer who paid for a course sat on a detail
     * page still offering to sell it — an invitation to pay a second time.
     */
    it("hands the caller's onSuccess to the checkout modal so the source page revalidates", async () => {
        mockPaymentOpen.mockClear()
        productMock.mockReturnValue({ data: { id: "p1", priceVnd: 399000 }, isLoading: false })
        const onSuccess = vi.fn()
        const { result } = renderHook(() =>
            useCourseEnrollment("khoa-a", undefined, { rawId: "uuid-a", title: "Khóa A", onSuccess }),
        )
        await act(async () => {
            await result.current.onEnroll()
        })
        expect(mockPaymentOpen).toHaveBeenCalled()
        expect(mockPaymentOpen.mock.calls[0][0].onSuccess).toBe(onSuccess)
    })
})
