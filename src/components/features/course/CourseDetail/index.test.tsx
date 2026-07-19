import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { CourseDetail as CourseDetailModel } from "../hooks/useQueryCourseDetailSwr"

/**
 * Component — the LEGACY enroll card (change `course-legacy-enroll-card-parity`).
 * Covers the spec scenarios: a discounted paid course renders ONE option (price +
 * struck original + −% chip, no fabricated Free/Premium tier), the "try free" entry
 * only exists when the course has free lessons, no challenge row without a real
 * `challengeCount`, and an enrolled viewer collapses to "Tiếp tục học".
 *
 * `t` is mocked to echo the message key (+ params), so assertions key off ids.
 * `PriceTag` is NOT mocked — the price/strike/percent logic under test lives there.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, params?: Record<string, unknown>) =>
        params ? `${key}:${JSON.stringify(params)}` : key,
    useLocale: () => "vi",
}))

// Phosphor icons → inert spans (enumerate what index.tsx imports; a Proxy
// namespace destabilises ESM interop and crashes the happy-dom worker).
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

// HeroUI primitives used by index.tsx + PriceTag.
vi.mock("@heroui/react", () => {
    const Chip = ({ children }: { children: React.ReactNode }) => <span>{children}</span>
    Chip.Label = ({ children }: { children: React.ReactNode }) => <span>{children}</span>
    return {
        Button: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
            <button type="button" onClick={onPress}>
                {children}
            </button>
        ),
        Chip,
        Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
        Tooltip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
        cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
    }
})

// next / routing / data plumbing the module pulls in at import time.
vi.mock("next/image", () => ({ default: () => <span /> }))
vi.mock("next/navigation", () => ({ useParams: () => ({ courseId: "c" }) }))
vi.mock("swr", () => ({ useSWRConfig: () => ({ mutate: vi.fn() }) }))
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
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
vi.mock("@/hooks/zustand/overlay/hooks", () => ({ usePaymentOverlayState: () => ({ open: vi.fn() }) }))
vi.mock("../hooks/useQueryCourseDetailSwr", () => ({ useQueryCourseDetailSwr: () => ({ course: undefined }) }))
vi.mock("../hooks/useCourseEnrollment", () => ({ useCourseEnrollment: () => ({}) }))
vi.mock("../hooks/useQueryCoursePackagesSwr", () => ({ useQueryCoursePackagesSwr: () => ({ packages: [] }) }))

// Feature/block children not under test.
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

import { EnrollCard } from "./index"

/** A LEGACY course model: 800.000₫ list → 500.000₫ charged, 10 lessons (2 free). */
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

const renderCard = (over: Partial<CourseDetailModel> = {}, isEnrolled = false) =>
    render(
        <EnrollCard
            course={course(over)}
            isEnrolled={isEnrolled}
            onEnroll={vi.fn()}
            onContinueLearning={vi.fn()}
            onTryLearning={vi.fn()}
        />,
    )

describe("EnrollCard (LEGACY)", () => {
    it("renders one paid option with the struck original and the −% chip", () => {
        renderCard()
        expect(screen.getByText("detail.wholeCourse")).toBeTruthy()
        expect(screen.getByText("500.000₫")).toBeTruthy()
        expect(screen.getByText("800.000₫")).toBeTruthy()
        expect(screen.getByText("−38%")).toBeTruthy()
        // no fabricated tier: neither a plan selector nor plan names survive
        const body = document.body.textContent ?? ""
        expect(body).not.toContain("planNames")
        expect(body).not.toContain("planSelectorAria")
        expect(body).not.toContain("planBadges")
        expect(screen.getByText("detail.enroll")).toBeTruthy()
    })

    it("hides the try-free entry when the course has no free lesson", () => {
        renderCard({ freeLessonCount: 0 })
        expect(screen.queryByText("detail.tryFree")).toBeNull()
    })

    it("renders no challenge benefit row when the contract carries no challengeCount", () => {
        renderCard()
        const body = document.body.textContent ?? ""
        expect(body).not.toContain("challenges")
        expect(body).not.toContain("certificate")
        // the rows that DO have a real figure are there
        expect(screen.getByText("detail.planIncludes.allLessons:{\"count\":10}")).toBeTruthy()
        expect(screen.getByText("detail.planIncludes.previewLessons:{\"count\":2}")).toBeTruthy()
    })

    it("collapses to a single continue CTA once enrolled", () => {
        renderCard({}, true)
        expect(screen.getByText("detail.continueLearning")).toBeTruthy()
        expect(screen.getByText("detail.enrolledHint")).toBeTruthy()
        expect(screen.queryByText("detail.enroll")).toBeNull()
        expect(screen.queryByText("500.000₫")).toBeNull()
    })
})
