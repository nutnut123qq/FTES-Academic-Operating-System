import { describe, expect, it, vi } from "vitest"

import { RestError } from "@/modules/api/rest/client"

import {
    ResourceUploadError,
    classifyResourceUploadError,
    emptyResourceUploadState,
    nextResourceUploadStep,
    retryStateAfter,
    runResourceUploadFlow,
    type ResourceUploadDeps,
    type ResourceUploadDraft,
    type ResourceUploadErrorReason,
    type ResourceUploadState,
    type ResourceUploadStep,
} from "./uploadFlow"
import {
    formatFileSize,
    resolveResourceMimeType,
    validateResourceFile,
} from "./uploadRules"

/**
 * Unit — state machine đăng học liệu (3 bước) + cửa kiểm file phía client.
 *
 * Chốt 2 điều feature này tồn tại để tránh:
 *  - upload đi ĐÚNG một request multipart `POST /resources/{id}/versions`; luồng presign cũ
 *    (`/versions/upload-url` → PUT → complete) đã bị BE gỡ, gọi vào là 404 và học liệu ra RỖNG
 *    (nghiệm thu E2E 2026-07-26);
 *  - hỏng ở bước nào thì resume ĐÚNG bước đó — không bao giờ `create` lại (sinh DRAFT mồ côi).
 */

/** Một `File` giả: happy-dom có `File`, nhưng cách này giữ số byte tất định. */
const fakeFile = (
    name: string,
    type: string,
    size: number,
): File => ({ name, type, size }) as unknown as File

const draftOf = (overrides: Partial<ResourceUploadDraft> = {}): ResourceUploadDraft => ({
    file: fakeFile("de-pe-prf192.pdf", "application/pdf", 2048),
    title: "  Đề PE PRF192  ",
    description: " ghi chú ",
    type: "PDF",
    subjectId: "11111111-1111-1111-1111-111111111111",
    visibility: "MEMBERS",
    license: "CC_BY",
    mimeType: "application/pdf",
    ...overrides,
})

interface SpyDeps extends ResourceUploadDeps {
    calls: Array<ResourceUploadStep>
}

/** Chờ một flow BẮT BUỘC hỏng và trả về {@link ResourceUploadError} của nó. */
const expectFlowFailure = async (
    run: Promise<unknown>,
): Promise<ResourceUploadError> => {
    let failure: unknown
    let settled = false
    try {
        await run
        settled = true
    } catch (error) {
        failure = error
    }
    if (settled) {
        throw new Error("expected the upload flow to fail")
    }
    if (!(failure instanceof ResourceUploadError)) {
        throw failure
    }
    return failure
}

/** Deps mà mọi bước đều thành công, có ghi lại thứ tự chạy. */
const happyDeps = (overrides: Partial<ResourceUploadDeps> = {}): SpyDeps => {
    const calls: Array<ResourceUploadStep> = []
    const deps: SpyDeps = {
        calls,
        createResource: vi.fn(async () => {
            calls.push("create")
            return { id: "res-1", status: "DRAFT" } as never
        }),
        uploadVersion: vi.fn(async () => {
            calls.push("upload")
            return { id: "ver-1", versionNo: 1, uploadStatus: "UPLOADED" } as never
        }),
        submitResource: vi.fn(async () => {
            calls.push("submit")
            return { id: "res-1", status: "PENDING_APPROVAL" } as never
        }),
        ...overrides,
    }
    return deps
}

describe("nextResourceUploadStep", () => {
    it("đi create → upload → submit rồi dừng", () => {
        let state: ResourceUploadState = emptyResourceUploadState()
        expect(nextResourceUploadStep(state)).toBe("create")

        state = { ...state, resourceId: "res-1" }
        expect(nextResourceUploadStep(state)).toBe("upload")

        state = { ...state, versionId: "ver-1" }
        expect(nextResourceUploadStep(state)).toBe("submit")

        state = { ...state, submitted: true }
        expect(nextResourceUploadStep(state)).toBeNull()
    })
})

describe("runResourceUploadFlow — happy path", () => {
    it("chạy đúng 3 bước, đúng thứ tự, và trả học liệu đã gửi duyệt", async () => {
        const deps = happyDeps()
        const result = await runResourceUploadFlow(draftOf(), deps)

        expect(deps.calls).toEqual(["create", "upload", "submit"])
        expect(result.state).toEqual({ resourceId: "res-1", versionId: "ver-1", submitted: true })
        expect(result.resource).toMatchObject({ status: "PENDING_APPROVAL" })
    })

    it("gửi file + changelog đã trim sang endpoint multipart", async () => {
        const deps = happyDeps()
        const draft = draftOf({ changelog: "  bản 2  " })
        await runResourceUploadFlow(draft, deps)

        expect(deps.uploadVersion).toHaveBeenCalledWith("res-1", draft.file, "bản 2")
    })

    it("trim tiêu đề/mô tả khi tạo bản ghi", async () => {
        const deps = happyDeps()
        await runResourceUploadFlow(draftOf(), deps)

        expect(deps.createResource).toHaveBeenCalledWith(
            expect.objectContaining({ title: "Đề PE PRF192", description: "ghi chú" }),
        )
    })
})

describe("runResourceUploadFlow — failure and resume", () => {
    it("upload hỏng → resume ở đúng bước upload, KHÔNG tạo lại học liệu", async () => {
        const failing = happyDeps({
            uploadVersion: vi.fn(async () => {
                throw new RestError("boom", 502)
            }),
        })
        const failure = await expectFlowFailure(runResourceUploadFlow(draftOf(), failing))

        expect(failure.step).toBe("upload")
        expect(failure.state.resourceId).toBe("res-1")
        expect(failure.state.versionId).toBeNull()
        expect(nextResourceUploadStep(failure.state)).toBe("upload")

        // Thử lại từ state đó: chỉ upload + submit chạy, create KHÔNG chạy lại.
        const retry = happyDeps()
        await runResourceUploadFlow(draftOf(), retry, failure.state)
        expect(retry.calls).toEqual(["upload", "submit"])
    })

    it("submit hỏng → giữ nguyên version đã nạp, chỉ chạy lại submit", async () => {
        const failing = happyDeps({
            submitResource: vi.fn(async () => {
                throw new RestError("nope", 403, "RESOURCE_ACCESS_DENIED")
            }),
        })
        const failure = await expectFlowFailure(runResourceUploadFlow(draftOf(), failing))

        expect(failure.step).toBe("submit")
        expect(failure.reason).toBe("forbidden")
        expect(failure.state.versionId).toBe("ver-1")
        expect(retryStateAfter("submit", failure.state).versionId).toBe("ver-1")

        const retry = happyDeps()
        await runResourceUploadFlow(draftOf(), retry, failure.state)
        expect(retry.calls).toEqual(["submit"])
    })

    it("báo bước hỏng ra callback tiến trình", async () => {
        const events: Array<string> = []
        const deps = happyDeps({
            submitResource: vi.fn(async () => {
                throw new RestError("nope", 403, "RESOURCE_ACCESS_DENIED")
            }),
        })
        deps.onStep = (step, status) => events.push(`${step}:${status}`)

        await runResourceUploadFlow(draftOf(), deps).catch(() => undefined)

        expect(events.at(-1)).toBe("submit:error")
    })
})

describe("classifyResourceUploadError", () => {
    const cases: Array<[unknown, ResourceUploadErrorReason]> = [
        [new RestError("x", 401), "auth"],
        [new RestError("x", 403), "forbidden"],
        [new RestError("x", 404), "notFound"],
        [new RestError("x", 429), "rateLimited"],
        [new RestError("x", 0), "network"],
        [new RestError("x", 502), "server"],
        [new RestError("x", 400, "RESOURCE_FILE_TOO_LARGE"), "tooLarge"],
        [new RestError("x", 400, "RESOURCE_UPLOAD_INCOMPLETE"), "checksum"],
        [new RestError("x", 400, "RESOURCE_VALIDATION"), "validation"],
        [new RestError("x", 409, "RESOURCE_INVALID_STATE"), "invalidState"],
        [new TypeError("Failed to fetch"), "network"],
    ]

    it.each(cases)("maps %o to %s", (error, reason) => {
        expect(classifyResourceUploadError(error).reason).toBe(reason)
    })
})

describe("validateResourceFile", () => {
    it("accepts a PDF for the PDF type and returns the MIME to send", () => {
        const result = validateResourceFile(
            fakeFile("giao-trinh.pdf", "application/pdf", 1024),
            "PDF",
        )
        expect(result).toEqual({ ok: true, mimeType: "application/pdf" })
    })

    it("rejects a MIME the BE whitelist does not carry for the picked type", () => {
        const result = validateResourceFile(
            fakeFile("clip.mp4", "video/mp4", 1024),
            "PDF",
        )
        expect(result).toEqual({ ok: false, reason: "type", maxSizeMb: 100 })
    })

    it("rejects a file above the per-type cap (NOTES = 50MB)", () => {
        const result = validateResourceFile(
            fakeFile("note.pdf", "application/pdf", 51 * 1024 * 1024),
            "NOTES",
        )
        expect(result).toEqual({ ok: false, reason: "size", maxSizeMb: 50 })
    })

    it("rejects a 0-byte file (BE `@Positive sizeBytes`)", () => {
        expect(
            validateResourceFile(fakeFile("empty.pdf", "application/pdf", 0), "PDF"),
        ).toMatchObject({ ok: false, reason: "empty" })
    })

    it("normalizes the Windows zip MIME to the spelling PE whitelists", () => {
        const result = validateResourceFile(
            fakeFile("de-pe.zip", "application/x-zip-compressed", 4096),
            "PE",
        )
        // PE only allows application/pdf + application/zip — sending the browser's
        // x-zip-compressed verbatim would 400 RESOURCE_VALIDATION.
        expect(result).toEqual({ ok: true, mimeType: "application/zip" })
    })

    it("falls back to the extension when the browser reports no type", () => {
        expect(resolveResourceMimeType({ name: "ghi-chu.md", type: "" }, "NOTES")).toBe(
            "text/markdown",
        )
    })

    it("strips a charset parameter before matching", () => {
        expect(
            resolveResourceMimeType(
                { name: "ghi-chu.txt", type: "text/plain; charset=utf-8" },
                "NOTES",
            ),
        ).toBe("text/plain")
    })
})

describe("formatFileSize", () => {
    it("renders human sizes", () => {
        expect(formatFileSize(512)).toBe("512 B")
        expect(formatFileSize(2048)).toBe("2 KB")
        expect(formatFileSize(8.4 * 1024 * 1024)).toBe("8.4 MB")
    })
})
