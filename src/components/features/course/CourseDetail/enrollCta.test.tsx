import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { CourseDetail as CourseDetailModel } from "../hooks/useQueryCourseDetailSwr"

/**
 * Component — the purchase cards of the course detail page (change
 * `course-enroll-cta-must-complete`).
 *
 * Three dead ends under test, all majority cases on real data:
 * 1. LEGACY course with no resolvable product → the enroll CTA used to be pressable and
 *    "navigated" to the page it was already on. It must be DISABLED + read "chưa mở bán".
 * 2. PACKAGE course with an empty package list → only "đang cập nhật gói", no payment step.
 *    It must reuse the gate modal's whole-course card (a real checkout).
 * 3. A FAILED package request was reported as a data state ("đang cập nhật gói") with no
 *    way out. It must read as an error and offer a retry.
 *
 * `t` echoes the message key so assertions key off ids. This file keeps its own mock set
 * (separate from `index.test.tsx`, which is red on master for unrelated reasons).
 */

const packagesMock = vi.fn()
const courseProductMock = vi.fn()

vi.mock("next-intl", () => ({
    useTranslations: (ns?: string) => (key: string, params?: Record<string, unknown>) => {
        const id = ns === "courseSystem.preview" ? `preview.${key}` : key
        return params ? `${id}:${JSON.stringify(params)}` : id
    },
    useLocale: () => "vi",
}))

// Phosphor icons → inert spans (a Proxy namespace destabilises ESM interop here).
vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return {
        BookIcon: Icon,
        BookOpenIcon: Icon,
        CaretDownIcon: Icon,
        CaretRightIcon: Icon,
        CertificateIcon: Icon,
        CheckCircleIcon: Icon,
        CheckIcon: Icon,
        CircleIcon: Icon,
        ClockIcon: Icon,
        GithubLogoIcon: Icon,
        GlobeIcon: Icon,
        GraduationCapIcon: Icon,
        LinkedinLogoIcon: Icon,
        LockIcon: Icon,
        LockSimpleIcon: Icon,
        PlayCircleIcon: Icon,
        PuzzlePieceIcon: Icon,
        ShoppingCartIcon: Icon,
        StackIcon: Icon,
        StarIcon: Icon,
        TrashIcon: Icon,
        TrophyIcon: Icon,
        UsersIcon: Icon,
    }
})

// HeroUI primitives. Button forwards `isDisabled` to the real `disabled` attribute so the
// "pressable but goes nowhere" regression is observable.
vi.mock("@heroui/react", () => {
    const Chip = ({ children }: { children: React.ReactNode }) => <span>{children}</span>
    Chip.Label = ({ children }: { children: React.ReactNode }) => <span>{children}</span>
    const Modal = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Backdrop = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Container = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Dialog = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Header = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Body = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    Modal.Footer = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    return {
        Button: ({
            children,
            onPress,
            isDisabled,
        }: {
            children: React.ReactNode
            onPress?: () => void
            isDisabled?: boolean
        }) => (
            <button type="button" onClick={onPress} disabled={isDisabled}>
                {children}
            </button>
        ),
        Chip,
        Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
        Modal,
        Skeleton: () => <div />,
        Tooltip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
    }
})

vi.mock("next/image", () => ({ default: () => <span /> }))
vi.mock("next/navigation", () => ({ useParams: () => ({ courseId: "c" }) }))
vi.mock("swr", () => ({ useSWRConfig: () => ({ mutate: vi.fn() }) }))
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/modules/api/rest/commerce", () => ({ isPaidOrderStatus: () => true }))
vi.mock("@/hooks/swr/api/rest/queries/useGetCourseProductSwr", () => ({
    useGetCourseProductSwr: () => courseProductMock(),
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetCoursePackageProductSwr", () => ({
    useGetCoursePackageProductSwr: () => ({ data: undefined, isLoading: false }),
}))
vi.mock("@/hooks/swr/api/rest/queries/useGetCartSwr", () => ({ useGetCartSwr: () => ({ data: undefined }) }))
vi.mock("@/hooks/swr/api/rest/mutations/usePostAddCartItemSwr", () => ({
    usePostAddCartItemSwr: () => ({ trigger: vi.fn(), isMutating: false }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostRemoveCartItemSwr", () => ({
    usePostRemoveCartItemSwr: () => ({ trigger: vi.fn(), isMutating: false }),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostCheckoutSwr", () => ({
    usePostCheckoutSwr: () => ({ trigger: vi.fn(), isMutating: false }),
}))
vi.mock("@/hooks/zustand/overlay/hooks", () => ({ usePaymentOverlayState: () => ({ open: vi.fn() }) }))
vi.mock("@/hooks/useRequireAuth", () => ({ useRequireAuth: () => ({ guard: (fn: () => void) => fn }) }))
vi.mock("../hooks/useQueryCourseDetailSwr", () => ({ useQueryCourseDetailSwr: () => ({ course: undefined }) }))
vi.mock("../hooks/useCourseEnrollment", () => ({ useCourseEnrollment: () => ({}) }))
vi.mock("../hooks/useQueryCoursePackagesSwr", () => ({
    useQueryCoursePackagesSwr: () => packagesMock(),
}))

// Children not under test.
vi.mock("./CourseRatings", () => ({ CourseRatings: () => <div /> }))
vi.mock("@/components/blocks/async/AsyncContent", () => ({ AsyncContent: () => <div /> }))
vi.mock("@/components/blocks/buttons/SaveButton", () => ({ SaveButton: () => <div /> }))
vi.mock("@/components/blocks/chips/HighlightChip", () => ({ HighlightChip: () => <div /> }))
vi.mock("@/components/blocks/navigation/ResponsiveBreadcrumb", () => ({ ResponsiveBreadcrumb: () => <div /> }))
vi.mock("@/components/blocks/navigation/SelectableCardGroup", () => ({ SelectableCardGroup: () => <div /> }))
vi.mock("@/components/blocks/skeleton/Skeleton", () => ({ Skeleton: () => <div /> }))
vi.mock("@/components/reuseable/FollowButton", () => ({ FollowButton: () => <div /> }))
vi.mock("@/components/reuseable/StatRibbon", () => ({ StatRibbon: () => <div /> }))
vi.mock("@/components/reuseable/UserAvatar", () => ({ UserAvatar: () => <div /> }))

import { EnrollCard, PackageEnrollCard } from "./index"

const course = (over: Partial<CourseDetailModel> = {}): CourseDetailModel => ({
    id: "khoa-a",
    rawId: "uuid-a",
    code: "PRF192",
    name: "Khóa A",
    saleMode: "LEGACY",
    level: "basic",
    credits: 0,
    description: "",
    durationLabel: "",
    price: { vnd: 500000, usd: 0, originalVnd: 800000 },
    rating: { avg: 0, count: 0 },
    lessonCount: 10,
    freeLessonCount: 2,
    whatYouLearn: [],
    sections: [],
    reviews: [],
    ...over,
})

/** The enroll CTA is the button whose label is the enroll or the not-on-sale key. */
const findCta = () => {
    const button = screen.queryByText("detail.enroll") ?? screen.queryByText("detail.notForSale")
    return button?.closest("button") ?? null
}

describe("EnrollCard — the buy CTA never leads nowhere", () => {
    it("disables the CTA and says 'chưa mở bán' when no product resolved", () => {
        render(
            <EnrollCard
                course={course()}
                isEnrolled={false}
                onEnroll={vi.fn()}
                canBuy={false}
                isResolvingProduct={false}
                onContinueLearning={vi.fn()}
                onTryLearning={vi.fn()}
            />,
        )
        expect(screen.getByText("detail.notForSale")).toBeTruthy()
        expect(screen.getByText("detail.notForSaleHint")).toBeTruthy()
        expect(screen.queryByText("detail.enroll")).toBeNull()
        expect(findCta()?.disabled).toBe(true)
        // (the free-trial row lives inside SelectableCardGroup, mocked out here — the
        // free path is asserted on the PACKAGE card below, where it is a real button)
    })

    it("keeps the CTA pressable with the enroll label when the product resolved", () => {
        render(
            <EnrollCard
                course={course()}
                isEnrolled={false}
                onEnroll={vi.fn()}
                canBuy={true}
                isResolvingProduct={false}
                onContinueLearning={vi.fn()}
                onTryLearning={vi.fn()}
            />,
        )
        expect(screen.getByText("detail.enroll")).toBeTruthy()
        expect(screen.queryByText("detail.notForSale")).toBeNull()
        expect(findCta()?.disabled).toBe(false)
    })

    it("does not conclude 'chưa mở bán' while the product lookup is still in flight", () => {
        render(
            <EnrollCard
                course={course()}
                isEnrolled={false}
                onEnroll={vi.fn()}
                canBuy={false}
                isResolvingProduct={true}
                onContinueLearning={vi.fn()}
                onTryLearning={vi.fn()}
            />,
        )
        expect(screen.getByText("detail.enroll")).toBeTruthy()
        expect(screen.queryByText("detail.notForSale")).toBeNull()
    })
})

describe("PackageEnrollCard — empty package list still has a checkout", () => {
    it("offers the whole course through the shared gate card when no package exists", () => {
        packagesMock.mockReturnValue({
            packages: [],
            isLoading: false,
            isError: false,
            isEmpty: true,
            retry: vi.fn(),
        })
        courseProductMock.mockReturnValue({
            data: { id: "p1", priceVnd: 399000, priceCoin: null },
            isLoading: false,
        })
        render(
            <PackageEnrollCard
                course={course({ saleMode: "PACKAGE" })}
                isEnrolled={false}
                onContinueLearning={vi.fn()}
                onTryLearning={vi.fn()}
            />,
        )
        // WholeCourseGateCard (reused from PackageGateModal), NOT a fifth copy of the flow
        expect(screen.getByText("detail.wholeCourse")).toBeTruthy()
        expect(screen.getByText("detail.enroll")).toBeTruthy()
        // the old dead end is gone
        expect(screen.queryByText("detail.package.updatingTitle")).toBeNull()
        // and the free-trial entry survives next to it
        expect(screen.getByText("detail.tryFree")).toBeTruthy()
    })

    it("keeps a no-offer message when the course carries no product either", () => {
        packagesMock.mockReturnValue({
            packages: [],
            isLoading: false,
            isError: false,
            isEmpty: true,
            retry: vi.fn(),
        })
        courseProductMock.mockReturnValue({ data: null, isLoading: false })
        render(
            <PackageEnrollCard
                course={course({ saleMode: "PACKAGE" })}
                isEnrolled={false}
                onContinueLearning={vi.fn()}
                onTryLearning={vi.fn()}
            />,
        )
        expect(screen.getByText("preview.modal.emptyTitle")).toBeTruthy()
        expect(screen.queryByText("detail.enroll")).toBeNull()
    })
})

describe("PackageEnrollCard — a failed request reads as an error, not as data", () => {
    it("shows the load error and a retry that revalidates", () => {
        const retry = vi.fn()
        packagesMock.mockReturnValue({
            packages: [],
            isLoading: false,
            isError: true,
            isEmpty: false,
            retry,
        })
        courseProductMock.mockReturnValue({ data: null, isLoading: false })
        render(
            <PackageEnrollCard
                course={course({ saleMode: "PACKAGE" })}
                isEnrolled={false}
                onContinueLearning={vi.fn()}
                onTryLearning={vi.fn()}
            />,
        )
        expect(screen.getByText("detail.package.errorTitle")).toBeTruthy()
        expect(screen.getByText("detail.package.errorHint")).toBeTruthy()
        // never blame the data for a request that failed
        expect(screen.queryByText("detail.package.updatingTitle")).toBeNull()
        screen.getByText("detail.retry").closest("button")?.click()
        expect(retry).toHaveBeenCalledTimes(1)
    })
})
