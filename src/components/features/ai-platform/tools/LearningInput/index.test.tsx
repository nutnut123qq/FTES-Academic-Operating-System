import React from "react"
import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — {@link resolveLearningInputRef} / {@link isLearningInputReady} + the
 * lesson picker's collection id.
 *
 * Pins the contract fix: the learning tools must submit a BE-accepted content
 * REFERENCE (`lessonId` when a lesson is picked, `storageKey` after an upload) —
 * never a raw `{text}` body, which `JobController.guardLearningInput` rejects with
 * 400 `AI_INPUT_INVALID`. And each lesson option carries a real `id` (the value
 * react-aria hands to `onAction`), not just a reserved React `key`.
 */

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

// Capture every DropdownItem's collection `id` so the picker-id fix is assertable.
const dropdownItems: Array<{ id?: string; textValue?: string }> = []
vi.mock("@heroui/react", () => {
    const Pass = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
    return {
        Button: ({ children, onPress }: { children?: React.ReactNode; onPress?: () => void }) => (
            <button type="button" onClick={onPress}>
                {children}
            </button>
        ),
        Typography: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
        Dropdown: Pass,
        DropdownTrigger: Pass,
        DropdownPopover: Pass,
        DropdownMenu: Pass,
        DropdownItem: ({
            children,
            id,
            textValue,
        }: {
            children?: React.ReactNode
            id?: string
            textValue?: string
        }) => {
            dropdownItems.push({ id, textValue })
            return <div data-item-id={id}>{children}</div>
        },
        cn: (...a: Array<unknown>) => a.filter(Boolean).join(" "),
    }
})

vi.mock("@phosphor-icons/react", () => {
    const Icon = () => <span />
    return {
        CaretDownIcon: Icon,
        BookOpenIcon: Icon,
        UploadSimpleIcon: Icon,
        FileArrowUpIcon: Icon,
        WarningCircleIcon: Icon,
    }
})

const lessons = [
    // base64url("Lesson:abc-1") / ("Lesson:xyz-2") — the opaque globalId the picker keys on.
    { globalId: "TGVzc29uOmFiYy0x", label: "Bài 1" },
    { globalId: "TGVzc29uOnh5ei0y", label: "Bài 2" },
]
vi.mock("@/hooks/swr/api/graphql/queries/useQueryMyLearnedLessonsSwr", () => ({
    useQueryMyLearnedLessonsSwr: () => ({ data: lessons, isLoading: false }),
}))

const uploadLearningFileToStorage = vi.fn()
vi.mock("./upload", () => ({
    uploadLearningFileToStorage: (...a: Array<unknown>) => uploadLearningFileToStorage(...a),
    validateLearningFile: () => null,
}))

import {
    LearningInput,
    emptyLearningInput,
    isLearningInputReady,
    resolveLearningInputRef,
    type LearningInputValue,
} from "./index"

const value = (over: Partial<LearningInputValue>): LearningInputValue => ({
    ...emptyLearningInput,
    ...over,
})

beforeEach(() => {
    dropdownItems.length = 0
    uploadLearningFileToStorage.mockReset()
})

describe("resolveLearningInputRef", () => {
    it("sends { lessonId } for a picked lesson (no upload)", async () => {
        await expect(
            resolveLearningInputRef(value({ mode: "lesson", lessonId: "raw-1", lessonLabel: "Bài 1" })),
        ).resolves.toEqual({ lessonId: "raw-1" })
        expect(uploadLearningFileToStorage).not.toHaveBeenCalled()
    })

    it("uploads the file and sends { storageKey } in upload mode", async () => {
        uploadLearningFileToStorage.mockResolvedValue("upload/2026/07/key.pdf")
        const file = new File(["cv"], "notes.pdf", { type: "application/pdf" })
        await expect(
            resolveLearningInputRef(value({ mode: "upload", file })),
        ).resolves.toEqual({ storageKey: "upload/2026/07/key.pdf" })
        expect(uploadLearningFileToStorage).toHaveBeenCalledWith(file)
    })

    it("never sends a raw { text } body (the rejected legacy shape)", async () => {
        const ref = await resolveLearningInputRef(
            value({ mode: "lesson", lessonId: "raw-1" }),
        )
        expect(ref).not.toHaveProperty("text")
    })

    it("throws when there is no valid source", async () => {
        await expect(resolveLearningInputRef(value({ mode: "lesson", lessonId: null }))).rejects.toThrow()
        await expect(resolveLearningInputRef(value({ mode: "upload", file: null }))).rejects.toThrow()
    })
})

describe("isLearningInputReady", () => {
    const file = new File(["x"], "a.pdf", { type: "application/pdf" })

    it("is ready only with a picked lesson in lesson mode", () => {
        expect(isLearningInputReady(value({ mode: "lesson", lessonId: "raw-1" }))).toBe(true)
        expect(isLearningInputReady(value({ mode: "lesson", lessonId: null }))).toBe(false)
    })

    it("is ready only with a valid file in upload mode", () => {
        expect(isLearningInputReady(value({ mode: "upload", file }))).toBe(true)
        expect(isLearningInputReady(value({ mode: "upload", file: null }))).toBe(false)
        expect(isLearningInputReady(value({ mode: "upload", file, fileError: "type" }))).toBe(false)
    })
})

describe("LearningInput lesson picker", () => {
    it("gives each lesson option a real collection id (the opaque globalId)", () => {
        render(<LearningInput value={value({ mode: "lesson" })} onChange={() => {}} />)
        expect(dropdownItems.map((item) => item.id)).toEqual([
            "TGVzc29uOmFiYy0x",
            "TGVzc29uOnh5ei0y",
        ])
    })
})
