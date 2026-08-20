import React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { SWRConfig } from "swr"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the subject identity read + the membership write.
 *
 * The contract pinned here is the one that used to be faked: `Subject.isMember` was
 * hardcoded `false`, so the AI hub was locked for everybody and the Overview always
 * claimed "bạn đã tham gia". Membership must come from the workspace aggregate's
 * `callerMembership` (which only arrives when the read carries the Bearer token), and
 * pressing "Tham gia" must really POST and refresh that aggregate.
 */

const restRequest = vi.fn()
const getSubjectDetail = vi.fn()
const joinSubject = vi.fn()
const leaveSubject = vi.fn()
const apolloQuery = vi.fn()
const requireAuth = vi.fn(() => true)
const toastSuccess = vi.fn()
const toastDanger = vi.fn()

/**
 * `vi.mock` factories are hoisted above the module body, so the stand-in error class
 * must be hoisted with them — a plain `class` declaration here is still in its TDZ
 * when the factory runs and the whole suite fails to collect.
 */
const { MockRestError } = vi.hoisted(() => {
    class MockRestError extends Error {
        status: number
        constructor(message: string, status: number) {
            super(message)
            this.status = status
        }
    }
    return { MockRestError }
})

vi.mock("@/modules/api/rest/client", () => ({
    restRequest: (config: unknown) => restRequest(config),
    RestError: MockRestError,
}))
vi.mock("@/modules/api/rest/subject", () => ({
    getSubjectDetail: (code: string) => getSubjectDetail(code),
    joinSubject: (code: string) => joinSubject(code),
    leaveSubject: (code: string) => leaveSubject(code),
}))
vi.mock("@/modules/api/graphql/clients", () => ({
    createAuthApolloClient: () => ({ query: (options: unknown) => apolloQuery(options) }),
}))
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
    // Tên môn chọn theo locale (BE trả cả name/nameVi) → hook đọc useLocale.
    useLocale: () => "vi",
}))
vi.mock("@heroui/react", () => ({
    toast: {
        success: (message: string) => toastSuccess(message),
        danger: (message: string) => toastDanger(message),
    },
}))
vi.mock("@/hooks/useRequireAuth", () => ({
    useRequireAuth: () => ({
        requireAuth,
        requireAuthAsync: async () => requireAuth(),
        authenticated: true,
        guard: vi.fn(),
    }),
}))

/** Redux stand-in: a signed-in viewer (the workspace read is auth-scoped). */
const state = {
    keycloak: { authenticated: true },
    user: { user: { id: "viewer-1" } },
}
vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (s: typeof state) => unknown) => selector(state),
    useAppDispatch: () => vi.fn(),
}))

import { useMutateSubjectMembershipSwr } from "./useMutateSubjectMembershipSwr"
import { useQuerySubjectSwr } from "./useQuerySubjectSwr"

const CODE = "PRF192"

const detail = {
    id: "subject-uuid",
    code: CODE,
    name: "Programming Fundamentals",
    nameVi: "Lập trình cơ bản",
    description: "",
    credits: 3,
    recommendedSemester: 1,
    difficulty: "EASY",
    learningOutcomes: [],
    roadmap: [],
    thumbnailUrl: "",
    status: "PUBLISHED",
    prerequisites: [],
    related: [],
    lecturers: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
}

/** Workspace aggregate with the caller membership under test. */
const workspace = (callerMembership: { role: string; joinedAt: string } | null) => ({
    overview: detail,
    learning: {
        available: true,
        data: {
            links: [
                {
                    id: "link-2",
                    targetType: "COURSE",
                    targetId: "course-2",
                    title: "CSD201 - Cấu trúc dữ liệu",
                    pinned: false,
                    sortOrder: 2,
                },
                {
                    id: "link-1",
                    targetType: "COURSE",
                    targetId: "course-1",
                    title: "PRF192 - Lập trình C",
                    pinned: true,
                    sortOrder: 5,
                },
                {
                    id: "link-3",
                    targetType: "RESOURCE",
                    targetId: "resource-1",
                    title: "Slide chương 1",
                    pinned: false,
                    sortOrder: 1,
                },
            ],
        },
    },
    resources: { available: false, data: null },
    community: { available: false, data: null },
    practice: { available: false, data: null },
    ai: { available: false, data: null },
    members: { available: false, data: null },
    statistics: { available: false, data: null },
    careerBridge: { available: false, data: null },
    callerMembership,
})

/** Render the read + write together inside an isolated SWR cache. */
const setup = () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
            {children}
        </SWRConfig>
    )
    return renderHook(
        () => ({
            read: useQuerySubjectSwr(CODE.toLowerCase()),
            write: useMutateSubjectMembershipSwr(CODE.toLowerCase()),
        }),
        { wrapper },
    )
}

beforeEach(() => {
    restRequest.mockReset()
    getSubjectDetail.mockReset()
    joinSubject.mockReset()
    leaveSubject.mockReset()
    apolloQuery.mockReset()
    toastSuccess.mockReset()
    toastDanger.mockReset()
    requireAuth.mockReset()
    requireAuth.mockReturnValue(true)
    getSubjectDetail.mockResolvedValue(detail)
    apolloQuery.mockResolvedValue({ data: { subjectMastery: null } })
})

describe("useQuerySubjectSwr", () => {
    it("reads the workspace WITH the bearer token (no auth opt-out)", async () => {
        restRequest.mockResolvedValue(workspace(null))
        setup()

        await waitFor(() => expect(restRequest).toHaveBeenCalled())
        const config = restRequest.mock.calls[0][0] as {
            method: string
            url: string
            authenticated?: boolean
        }
        expect(config.url).toBe(`/subjects/${CODE}/workspace`)
        // `authenticated` must NOT be false — callerMembership is only filled for an
        // identified caller.
        expect(config.authenticated).not.toBe(false)
    })

    it("maps isMember from callerMembership: null → not a member", async () => {
        restRequest.mockResolvedValue(workspace(null))
        const { result } = setup()

        await waitFor(() => expect(result.current.read.subject).toBeDefined())
        await waitFor(() => expect(result.current.read.isMembershipLoading).toBe(false))
        expect(result.current.read.subject?.isMember).toBe(false)
        expect(result.current.read.subject?.membershipRole).toBeNull()
    })

    it("maps isMember from callerMembership: present → a member with its role", async () => {
        restRequest.mockResolvedValue(
            workspace({ role: "MODERATOR", joinedAt: "2026-07-01T00:00:00Z" }),
        )
        const { result } = setup()

        await waitFor(() => expect(result.current.read.subject?.isMember).toBe(true))
        expect(result.current.read.subject?.membershipRole).toBe("MODERATOR")
    })

    it("maps the linked courses from learning.links (COURSE only, pinned first)", async () => {
        restRequest.mockResolvedValue(workspace(null))
        const { result } = setup()

        await waitFor(() =>
            expect(result.current.read.subject?.courseLinks.length).toBe(2),
        )
        expect(result.current.read.subject?.courseLinks.map((link) => link.id)).toEqual([
            "course-1",
            "course-2",
        ])
    })

    it("feeds the progress meter from subjectMastery.completionPct", async () => {
        restRequest.mockResolvedValue(workspace(null))
        apolloQuery.mockResolvedValue({
            data: {
                subjectMastery: {
                    completionPct: 42,
                    consistencyScore: 1,
                    subjectXp: 120,
                    masteryLevel: "BRONZE",
                },
            },
        })
        const { result } = setup()

        await waitFor(() => expect(result.current.read.subject?.progress).toBe(42))
    })
})

describe("useMutateSubjectMembershipSwr", () => {
    it("joins the subject and re-reads the workspace so the gate unlocks", async () => {
        restRequest.mockResolvedValueOnce(workspace(null))
        joinSubject.mockResolvedValue({ membershipId: "m1", role: "MEMBER" })
        const { result } = setup()

        await waitFor(() => expect(result.current.read.subject?.isMember).toBe(false))
        // the re-read after the write returns the joined aggregate
        restRequest.mockResolvedValue(
            workspace({ role: "MEMBER", joinedAt: "2026-07-25T00:00:00Z" }),
        )

        const joined = await result.current.write.join()

        expect(joined).toBe(true)
        expect(joinSubject).toHaveBeenCalledWith(CODE)
        expect(toastSuccess).toHaveBeenCalledWith("membership.joinSuccess")
        // the workspace cache was mutated → the membership gate flipped
        await waitFor(() => expect(result.current.read.subject?.isMember).toBe(true))
    })

    it("rolls the membership back and reports failure when the join fails", async () => {
        restRequest.mockResolvedValue(workspace(null))
        joinSubject.mockRejectedValue(new MockRestError("boom", 429))
        const { result } = setup()

        await waitFor(() => expect(result.current.read.subject?.isMember).toBe(false))

        const joined = await result.current.write.join()

        expect(joined).toBe(false)
        expect(toastDanger).toHaveBeenCalledWith("membership.rateLimited")
        await waitFor(() => expect(result.current.read.subject?.isMember).toBe(false))
    })

    it("does not send anything for a signed-out visitor", async () => {
        restRequest.mockResolvedValue(workspace(null))
        requireAuth.mockReturnValue(false)
        const { result } = setup()

        const joined = await result.current.write.join()

        expect(joined).toBe(false)
        expect(joinSubject).not.toHaveBeenCalled()
    })
})
