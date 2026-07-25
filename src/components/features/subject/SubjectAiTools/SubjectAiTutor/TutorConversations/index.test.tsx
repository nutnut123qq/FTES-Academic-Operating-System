import React from "react"
import { SWRConfig } from "swr"
import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { AiSessionView } from "@/modules/api/rest/ai"

/**
 * Component — {@link TutorConversations} on the subject-scoped sessions contract.
 *
 * The list used to show EVERY tutor conversation of the user (the old BE view
 * omitted `contextRef`). It now narrows server-side, so the assertions pin the
 * query actually sent: `feature=TUTOR_CHAT`, `subjectId=<subject UUID>` (never
 * the route code) and `status=ACTIVE` (archived rows must not come back).
 *
 * The REAL `useTutorSessionsInfiniteSwr` runs here — only the REST client, redux
 * and the presentational primitives are mocked.
 */

const h = vi.hoisted(() => ({
    listAiSessions: vi.fn<(params?: Record<string, unknown>) => Promise<Array<AiSessionView>>>(),
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}(${Object.values(values).join(",")})` : key,
}))

vi.mock("@/redux/hooks", () => ({
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ keycloak: { authenticated: true } }),
}))

vi.mock("@/modules/api/rest/ai", () => ({
    listAiSessions: h.listAiSessions,
    archiveSession: vi.fn(),
}))

vi.mock("@/hooks/swr/api/rest/mutations/usePostArchiveAiSessionSwr", () => ({
    usePostArchiveAiSessionSwr: () => ({ trigger: vi.fn() }),
}))

vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return { PlusIcon: Icon, TrashIcon: Icon }
})

vi.mock("@heroui/react", () => ({
    Button: ({
        children,
        onPress,
        isDisabled,
        ...rest
    }: {
        children?: React.ReactNode
        onPress?: () => void
        isDisabled?: boolean
        [key: string]: unknown
    }) => (
        <button
            type="button"
            disabled={isDisabled}
            onClick={onPress}
            aria-label={rest["aria-label"] as string | undefined}
        >
            {children}
        </button>
    ),
    ScrollShadow: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    cn: (...values: Array<unknown>) => values.filter(Boolean).join(" "),
}))

vi.mock("@/components/reuseable/SearchInput", () => ({
    SearchInput: ({ placeholder }: { placeholder?: string }) => (
        <input placeholder={placeholder} readOnly />
    ),
}))

vi.mock("@/components/blocks/async/AsyncContent", () => ({
    AsyncContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/blocks/async/EmptyContent", () => ({
    EmptyContent: ({ title }: { title?: string }) => <div>{title}</div>,
}))

vi.mock("@/components/blocks/async/InfiniteScrollSentinel", () => ({
    InfiniteScrollSentinel: () => <div />,
}))

vi.mock("@/components/blocks/skeleton/Skeleton", () => ({
    Skeleton: { Typography: () => <span /> },
}))

vi.mock("../../ToolSurfaceHeader", () => ({
    ToolSurfaceHeader: ({ title, trailing }: { title: string; trailing?: React.ReactNode }) => (
        <div>
            <h2>{title}</h2>
            {trailing}
        </div>
    ),
}))

import { TutorConversations } from "./index"

const SUBJECT_CODE = "PRF192"
const SUBJECT_UUID = "0f8b4b2e-6b6a-4a2f-9c1d-1f3f5a7b9c11"

const renderView = () =>
    render(
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
            <TutorConversations
                subjectUuid={SUBJECT_UUID}
                activeSessionId={null}
                onBack={() => {}}
                onNew={() => {}}
                onSwitch={() => {}}
            />
        </SWRConfig>,
    )

afterEach(() => {
    vi.clearAllMocks()
})

describe("TutorConversations — subject-scoped session list", () => {
    it("lists only THIS subject's ACTIVE tutor sessions (subjectId = UUID, not the route code)", async () => {
        h.listAiSessions.mockResolvedValue([
            {
                id: "sess-1",
                feature: "TUTOR_CHAT",
                title: "Con trỏ",
                status: "ACTIVE",
                messageCount: 4,
                contextRef: { subjectId: SUBJECT_UUID },
            },
        ])

        renderView()

        await waitFor(() => {
            expect(h.listAiSessions).toHaveBeenCalledWith({
                feature: "TUTOR_CHAT",
                subjectId: SUBJECT_UUID,
                status: "ACTIVE",
                page: 0,
                size: 20,
            })
        })
        const params = h.listAiSessions.mock.calls[0][0] as { subjectId?: string }
        expect(params.subjectId).not.toBe(SUBJECT_CODE)

        expect(await screen.findByText("Con trỏ")).toBeTruthy()
    })

    it("hides the never-used (empty) sessions the lazy create can leave behind", async () => {
        h.listAiSessions.mockResolvedValue([
            {
                id: "sess-empty",
                feature: "TUTOR_CHAT",
                title: "Cuộc rỗng",
                status: "ACTIVE",
                messageCount: 0,
            },
        ])

        renderView()

        await waitFor(() => {
            expect(h.listAiSessions).toHaveBeenCalled()
        })
        await waitFor(() => {
            expect(screen.getByText("subjects.aiTools.tutor.noConversations")).toBeTruthy()
        })
        expect(screen.queryByText("Cuộc rỗng")).toBeNull()
    })
})
