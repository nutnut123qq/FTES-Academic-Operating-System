import { describe, expect, it, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useCourseEnrollment } from "./useCourseEnrollment"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import React from "react"

vi.mock("next-intl", () => ({ useTranslations: () => vi.fn(), useLocale: () => "vi" }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/i18n/navigation", () => ({ pathConfig: () => ({ locale: () => ({ course: () => ({ learn: () => ({ build: () => "/learn" }) }) }) }) }))
vi.mock("@/modules/auth/hooks/useRequireAuth", () => ({ useRequireAuth: () => ({ guard: (fn: any) => fn }) }))

vi.mock("@/hooks/swr/api/rest/mutations/useMutateStartTrialSwr", () => ({ useMutateStartTrialSwr: () => ({ trigger: vi.fn() }) }))
vi.mock("@/hooks/swr/api/rest/queries/useGetCourseProductSwr", () => ({ useGetCourseProductSwr: () => ({ data: { id: "p1", priceVnd: 100 }, isLoading: false }) }))
vi.mock("@/hooks/swr/api/rest/mutations/usePostAddCartItemSwr", () => ({ usePostAddCartItemSwr: () => ({ trigger: vi.fn().mockResolvedValue({ id: "ci1" }), isMutating: false }) }))
vi.mock("@/hooks/swr/api/rest/mutations/usePostRemoveCartItemSwr", () => ({ usePostRemoveCartItemSwr: () => ({ trigger: vi.fn(), isMutating: false }) }))

const mockPaymentOpen = vi.fn()
vi.mock("@/hooks/zustand/overlay/hooks", () => ({
    usePaymentOverlayState: () => ({ open: mockPaymentOpen }),
    useAuthenticationOverlayState: () => ({ open: vi.fn() })
}))
vi.mock("swr", () => ({ useSWRConfig: () => ({ mutate: vi.fn() }) }))
vi.mock("@/hooks/swr/api/rest/queries/useGetCartSwr", () => ({ useGetCartSwr: () => ({ data: { items: [] } }) }))

const store = configureStore({
    reducer: { keycloak: () => ({ authenticated: true }) }
})
const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(Provider, { store, children } as any)

describe("useCourseEnrollment", () => {
    it("passes onSuccess to payment.open to fix the stale UI bug", async () => {
        const onSuccess = vi.fn()
        const { result } = renderHook(() => useCourseEnrollment("c1", undefined, { rawId: "r1", title: "C1", onSuccess }), { wrapper })

        await act(async () => {
            await result.current.onEnroll()
        })

        expect(mockPaymentOpen).toHaveBeenCalled()
        const callArgs = mockPaymentOpen.mock.calls[0][0]
        expect(callArgs.onSuccess).toBe(onSuccess)
    })
})
