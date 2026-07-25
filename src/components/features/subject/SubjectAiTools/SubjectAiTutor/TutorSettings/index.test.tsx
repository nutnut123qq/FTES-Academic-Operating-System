import React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { AiSessionView } from "@/modules/api/rest/ai"

/**
 * Component — {@link TutorSettings} "clear conversations" on the bulk-archive
 * contract.
 *
 * It used to loop `DELETE /ai/sessions/{id}` over every loaded session (N+1, and
 * it wiped OTHER subjects too). It now issues ONE
 * `DELETE /ai/sessions?feature=TUTOR_CHAT&subjectId=…`, echoes `{archived}` and
 * revalidates the list.
 */

const h = vi.hoisted(() => ({
    deleteAiSessions: vi.fn<
        (params?: Record<string, unknown>) => Promise<{ archived: number }>
    >(),
    mutate: vi.fn(),
    sessions: [] as Array<Array<AiSessionView>>,
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values ? `${key}(${Object.values(values).join(",")})` : key,
}))

vi.mock("@/modules/api/rest/ai", () => ({
    deleteAiSessions: h.deleteAiSessions,
}))

vi.mock("../useSubjectTutorSwr", () => ({
    TUTOR_SESSIONS_PAGE_SIZE: 20,
    useTutorSessionsInfiniteSwr: () => ({ data: h.sessions, mutate: h.mutate }),
}))

vi.mock("@heroui/react", () => ({
    Button: ({
        children,
        onPress,
        isDisabled,
    }: {
        children?: React.ReactNode
        onPress?: () => void
        isDisabled?: boolean
    }) => (
        <button type="button" disabled={isDisabled} onClick={onPress}>
            {children}
        </button>
    ),
    Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock("../../ToolSurfaceHeader", () => ({
    ToolSurfaceHeader: ({ title }: { title: string }) => <h2>{title}</h2>,
}))

import { TutorSettings } from "./index"

const SUBJECT_UUID = "0f8b4b2e-6b6a-4a2f-9c1d-1f3f5a7b9c11"

const onCleared = vi.fn()

const renderSettings = () =>
    render(
        <TutorSettings
            subjectUuid={SUBJECT_UUID}
            modelLabel="model-x"
            onBack={() => {}}
            onCleared={onCleared}
        />,
    )

const pressClear = async () => {
    await act(async () => {
        fireEvent.click(screen.getByText("subjects.aiTools.tutor.clearActionSubject"))
    })
}

beforeEach(() => {
    h.sessions = [
        [
            { id: "s1", feature: "TUTOR_CHAT", status: "ACTIVE", messageCount: 3 },
            { id: "s2", feature: "TUTOR_CHAT", status: "ACTIVE", messageCount: 1 },
        ],
    ]
    h.deleteAiSessions.mockResolvedValue({ archived: 2 })
})

afterEach(() => {
    vi.clearAllMocks()
})

describe("TutorSettings — bulk archive scoped to the subject", () => {
    it("archives in ONE request filtered by feature + subjectId, then revalidates the list", async () => {
        renderSettings()

        await pressClear()

        expect(h.deleteAiSessions).toHaveBeenCalledTimes(1)
        expect(h.deleteAiSessions).toHaveBeenCalledWith({
            feature: "TUTOR_CHAT",
            subjectId: SUBJECT_UUID,
        })
        expect(h.mutate).toHaveBeenCalled()
        expect(onCleared).toHaveBeenCalledTimes(1)
        // the {archived} count is surfaced, not swallowed
        expect(screen.getByText("subjects.aiTools.tutor.clearedCount(2)")).toBeTruthy()
    })

    it("shows a translated error and still revalidates when the archive fails", async () => {
        h.deleteAiSessions.mockRejectedValue(new Error("boom"))
        renderSettings()

        await pressClear()

        await waitFor(() => {
            expect(screen.getByText("subjects.aiTools.tutor.clearError")).toBeTruthy()
        })
        expect(h.mutate).toHaveBeenCalled()
        expect(onCleared).not.toHaveBeenCalled()
    })

    it("disables the action when this subject has no conversation left", () => {
        h.sessions = [[]]
        renderSettings()

        const button = screen.getByText(
            "subjects.aiTools.tutor.clearActionSubject",
        ) as HTMLButtonElement
        expect(button.disabled).toBe(true)
    })
})
