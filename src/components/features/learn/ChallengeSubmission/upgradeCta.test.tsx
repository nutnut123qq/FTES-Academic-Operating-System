import React from "react"
import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { RestError } from "@/modules/api/rest/client"

/**
 * Component — the course-bank access-denied card (challenge-lesson-level-access-gate 5.2).
 *
 * BE contract: a 403 `CHALLENGE_COURSE_ACCESS_DENIED` carries `data.courseId` and — when the
 * viewer already bought a tier that does NOT cover the attached lesson — `data.requiredPackageSlugs`
 * (the packages that DO unlock it). Two branches under test:
 *   - slugs present → "Nâng cấp gói" CTA + tier chips (lesson-tier-badge labels) + the shared
 *     PackageGateModal scoped to exactly those slugs (context "challenge");
 *   - slugs absent/empty (older BE, or a plain not-enrolled denial) → the old enroll CTA.
 */

const state = vi.hoisted(() => ({ error: undefined as Error | undefined }))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => "vi",
}))

vi.mock("next/navigation", () => ({
    useParams: () => ({
        courseId: "khoa-a",
        moduleId: "m1",
        contentId: "lesson-1",
        challengeId: "ch-1",
    }),
}))

vi.mock("@/i18n/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@heroui/react", () => ({
    Button: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
        <button type="button" onClick={onPress}>{children}</button>
    ),
    Chip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Input: () => <input />,
    TextField: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
}))

vi.mock("@phosphor-icons/react", () => ({
    CheckSquareIcon: () => <span />,
    LockSimpleIcon: () => <span />,
    PuzzlePieceIcon: () => <span />,
    SquareIcon: () => <span />,
}))

vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock("@/components/blocks/layout/PageHeader", () => ({ PageHeader: () => <div /> }))
vi.mock("@/components/blocks/skeleton/Skeleton", () => ({ Skeleton: () => <div /> }))
vi.mock("@/components/reuseable/MarkdownContent", () => ({ MarkdownContent: () => <div /> }))
vi.mock("@/modules/toast/hooks", () => ({
    useRestWithToast: () => (fn: () => Promise<unknown>) => fn().catch(() => null),
}))
vi.mock("@/hooks/swr/api/rest/mutations/usePostSubmitChallengeSwr", () => ({
    usePostSubmitChallengeSwr: () => ({ trigger: vi.fn(), isMutating: false }),
}))

// The gate modal is exercised elsewhere (PackageGateModal/index.test.tsx); here we only
// assert it receives the denial's slugs/course and opens on the CTA press.
vi.mock("@/components/features/course/PackageGateModal", () => ({
    PackageGateModal: (props: {
        isOpen: boolean
        courseRawId: string
        packageSlugs: Array<string>
        context: string
    }) => (
        <div
            data-testid="package-gate-modal"
            data-open={String(props.isOpen)}
            data-course-raw-id={props.courseRawId}
            data-slugs={props.packageSlugs.join(",")}
            data-context={props.context}
        />
    ),
}))

// One real package name so the tier chip resolves the admin-authored label;
// the second slug falls back to TIER_LABEL_FALLBACK (real tierLabels module).
vi.mock("@/components/features/course/hooks/useQueryCoursePackagesSwr", () => ({
    useQueryCoursePackagesSwr: () => ({
        packages: [{ slug: "premium", name: "Gói Premium" }],
        isLoading: false,
        isError: false,
        isEmpty: false,
        retry: vi.fn(),
    }),
}))

vi.mock("../hooks/useQueryLearnCourseSwr", () => ({
    useQueryLearnCourseSwr: () => ({
        course: { id: "uuid-course" },
        modules: [],
        header: { title: "Khóa A" },
        navSections: [],
        isLoading: false,
        error: undefined,
        mutate: vi.fn(),
    }),
}))

vi.mock("../hooks/useQueryChallengeSubmissionSwr", () => ({
    isChallengeSubmissionPending: () => false,
    useQueryChallengeSubmissionSwr: () => ({
        challenge: undefined,
        submissions: [],
        isLoading: false,
        error: state.error,
        mutate: vi.fn(),
    }),
}))

import { ChallengeSubmission } from "./index"

/** A 403 denial with the given error body (undefined = legacy BE without extras). */
const denied = (body?: ConstructorParameters<typeof RestError>[3]) =>
    new RestError(
        "Forbidden — CHALLENGE_COURSE_ACCESS_DENIED",
        403,
        "CHALLENGE_COURSE_ACCESS_DENIED",
        body,
    )

describe("ChallengeSubmission — access-denied CTA (challenge-lesson-level-access-gate)", () => {
    it("shows the upgrade CTA + tier chips and opens the gate modal when requiredPackageSlugs is present", () => {
        state.error = denied({
            errorCode: "CHALLENGE_COURSE_ACCESS_DENIED",
            traceId: "t-1",
            details: [],
            courseId: "uuid-from-error",
            requiredPackageSlugs: ["premium", "master"],
        })
        const { getByText, queryByText, getByTestId } = render(<ChallengeSubmission />)

        expect(getByText("exercises.challenge.upgradeTitle")).toBeTruthy()
        expect(queryByText("reader.enrollCta")).toBeNull()
        // Tier chips: real package name first, TIER_LABEL_FALLBACK for the rest.
        expect(getByText("Gói Premium")).toBeTruthy()
        expect(getByText("Master")).toBeTruthy()

        const modal = getByTestId("package-gate-modal")
        expect(modal.getAttribute("data-open")).toBe("false")
        expect(modal.getAttribute("data-slugs")).toBe("premium,master")
        expect(modal.getAttribute("data-context")).toBe("challenge")
        // The error body's courseId wins over the learn-tree fallback.
        expect(modal.getAttribute("data-course-raw-id")).toBe("uuid-from-error")

        fireEvent.click(getByText("exercises.challenge.upgradeCta"))
        expect(getByTestId("package-gate-modal").getAttribute("data-open")).toBe("true")
    })

    it("keeps the enroll CTA when the denial has no requiredPackageSlugs", () => {
        state.error = denied()
        const { getByText, queryByText, queryByTestId } = render(<ChallengeSubmission />)

        expect(getByText("exercises.challenge.lockedTitle")).toBeTruthy()
        expect(getByText("reader.enrollCta")).toBeTruthy()
        expect(queryByText("exercises.challenge.upgradeCta")).toBeNull()
        expect(queryByTestId("package-gate-modal")).toBeNull()
    })

    it("keeps the enroll CTA when requiredPackageSlugs is present but empty", () => {
        state.error = denied({
            errorCode: "CHALLENGE_COURSE_ACCESS_DENIED",
            traceId: "t-2",
            details: [],
            courseId: "uuid-from-error",
            requiredPackageSlugs: [],
        })
        const { getByText, queryByText } = render(<ChallengeSubmission />)

        expect(getByText("reader.enrollCta")).toBeTruthy()
        expect(queryByText("exercises.challenge.upgradeCta")).toBeNull()
    })
})
