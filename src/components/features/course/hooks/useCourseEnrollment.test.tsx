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
vi.mock("@/resources/path", () => ({ pathConfig: () => ({ locale: () => ({ course: () => ({ learn: () => ({ build: () => "/learn" }) }) }) }) }))
vi.mock("@/hooks/swr/api/rest/mutations/usePostAddCartItemSwr", () => ({
    usePostAddCartItemSwr: () => ({ trigger: vi.fn().mockResolvedValue({ id: "item1" }), isMutating: false }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostRemoveCartItemSwr", () => ({
    usePostRemoveCartItemSwr: () => ({ trigger: vi.fn(), isMutating: false }),
}))
const mockPaymentOpen = vi.fn()
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

    it("passes onSuccess to payment.open to fix the stale UI bug", async () => {
        mockPaymentOpen.mockClear()
        productMock.mockReturnValue({ data: { id: "p1", priceVnd: 399000 }, isLoading: false })
        const onSuccess = vi.fn()
        const { result } = renderHook(() =>
            useCourseEnrollment("khoa-a", undefined, { rawId: "uuid-a", title: "Khóa A", onSuccess })
        )
        await act(async () => {
            await result.current.onEnroll()
        })
        expect(mockPaymentOpen).toHaveBeenCalled()
        const callArgs = mockPaymentOpen.mock.calls[0][0]
        expect(callArgs.onSuccess).toBe(onSuccess)
    })
})
