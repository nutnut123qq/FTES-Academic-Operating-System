import { describe, expect, it, vi } from "vitest"

import { RestError } from "@/modules/api/rest/client"

import {
    ResourceStoragePutError,
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
 * Unit — the resource publish chain state machine + the client-side file gate.
 *
 * Pins the two contract traps this feature exists to avoid:
 *  - the BE wants the SHA-256 **before** it will presign (`UploadUrlRequest` has a
 *    `@NotBlank @Size(64,64) checksumSha256`), so `hash` must precede `create`/`uploadUrl`
 *    and the SAME checksum + size must be replayed on `complete`;
 *  - a failure must resume from the failed step — never re-`create` the resource (that
 *    would leave orphan DRAFT rows) and never re-hash a file that already hashed.
 */

/** A `File` stand-in: happy-dom has `File`, but this keeps the bytes deterministic. */
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

/** Awaits a flow that MUST fail and returns its typed {@link ResourceUploadError}. */
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

/** Deps whose steps all succeed, recording the order they ran in. */
const happyDeps = (overrides: Partial<ResourceUploadDeps> = {}): SpyDeps => {
    const calls: Array<ResourceUploadStep> = []
    const deps: SpyDeps = {
        calls,
        hashFile: vi.fn(async () => {
            calls.push("hash")
            return "a".repeat(64)
        }),
        createResource: vi.fn(async () => {
            calls.push("create")
            return { id: "res-1", status: "DRAFT" } as never
        }),
        createUploadUrl: vi.fn(async () => {
            calls.push("uploadUrl")
            return {
                versionId: "ver-1",
                versionNo: 1,
                presignedPutUrl: "https://s3.local/put?sig=1",
                storageKey: "resource/res-1/v1/de-pe-prf192.pdf",
            }
        }),
        putObject: vi.fn(async () => {
            calls.push("put")
        }),
        completeUpload: vi.fn(async () => {
            calls.push("complete")
            return { id: "ver-1", uploadStatus: "UPLOADED" } as never
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
    it("walks the chain in BE order, hashing before the presign", () => {
        const seen: Array<ResourceUploadStep> = []
        let state = emptyResourceUploadState()

        seen.push(nextResourceUploadStep(state) as ResourceUploadStep)
        state = { ...state, checksumSha256: "a".repeat(64), sizeBytes: 10 }
        seen.push(nextResourceUploadStep(state) as ResourceUploadStep)
        state = { ...state, resourceId: "res-1" }
        seen.push(nextResourceUploadStep(state) as ResourceUploadStep)
        state = { ...state, versionId: "ver-1", presignedPutUrl: "https://s3/put" }
        seen.push(nextResourceUploadStep(state) as ResourceUploadStep)
        state = { ...state, uploaded: true }
        seen.push(nextResourceUploadStep(state) as ResourceUploadStep)
        state = { ...state, completed: true }
        seen.push(nextResourceUploadStep(state) as ResourceUploadStep)
        state = { ...state, submitted: true }

        expect(seen).toEqual([
            "hash",
            "create",
            "uploadUrl",
            "put",
            "complete",
            "submit",
        ])
        expect(nextResourceUploadStep(state)).toBeNull()
    })

    it("re-presigns when the version was dropped but the resource survived", () => {
        const state: ResourceUploadState = {
            ...emptyResourceUploadState(),
            checksumSha256: "b".repeat(64),
            sizeBytes: 5,
            resourceId: "res-1",
        }
        expect(nextResourceUploadStep(state)).toBe("uploadUrl")
    })
})

describe("runResourceUploadFlow — happy path", () => {
    it("runs create → presign → PUT → complete → submit with the BE-required payloads", async () => {
        const deps = happyDeps()
        const draft = draftOf()

        const outcome = await runResourceUploadFlow(draft, deps)

        expect(deps.calls).toEqual([
            "hash",
            "create",
            "uploadUrl",
            "put",
            "complete",
            "submit",
        ])
        expect(deps.createResource).toHaveBeenCalledWith({
            title: "Đề PE PRF192",
            description: "ghi chú",
            type: "PDF",
            subjectId: "11111111-1111-1111-1111-111111111111",
            visibility: "MEMBERS",
            license: "CC_BY",
        })
        // presign carries the checksum the BE validates as @Size(min=64,max=64)
        expect(deps.createUploadUrl).toHaveBeenCalledWith("res-1", {
            filename: "de-pe-prf192.pdf",
            mimeType: "application/pdf",
            sizeBytes: 2048,
            checksumSha256: "a".repeat(64),
            changelog: undefined,
        })
        // the PUT must use the MIME the presign was signed with
        expect(deps.putObject).toHaveBeenCalledWith(
            "https://s3.local/put?sig=1",
            draft.file,
            "application/pdf",
        )
        // complete replays the SAME checksum + size (BE re-stats and compares both)
        expect(deps.completeUpload).toHaveBeenCalledWith("ver-1", {
            checksumSha256: "a".repeat(64),
            sizeBytes: 2048,
        })
        expect(deps.submitResource).toHaveBeenCalledWith("res-1")
        expect(outcome.resource.status).toBe("PENDING_APPROVAL")
        expect(nextResourceUploadStep(outcome.state)).toBeNull()
    })

    it("reports every step as running then done", async () => {
        const events: Array<string> = []
        const deps = happyDeps()
        deps.onStep = (step, status) => events.push(`${step}:${status}`)

        await runResourceUploadFlow(draftOf(), deps)

        expect(events).toEqual([
            "hash:running",
            "hash:done",
            "create:running",
            "create:done",
            "uploadUrl:running",
            "uploadUrl:done",
            "put:running",
            "put:done",
            "complete:running",
            "complete:done",
            "submit:running",
            "submit:done",
        ])
    })
})

describe("runResourceUploadFlow — failure and resume", () => {
    it("stops at the failing step and maps the BE error code to a reason", async () => {
        const deps = happyDeps({
            createUploadUrl: vi.fn(async () => {
                throw new RestError("rate limited", 429, "RESOURCE_RATE_LIMITED")
            }),
        })

        const failure = await expectFlowFailure(runResourceUploadFlow(draftOf(), deps))

        expect(failure).toBeInstanceOf(ResourceUploadError)
        expect(failure.step).toBe("uploadUrl")
        expect(failure.reason).toBe("rateLimited")
        expect(deps.submitResource).not.toHaveBeenCalled()
        // the resource already exists — the retry state keeps it
        expect(failure.state.resourceId).toBe("res-1")
        expect(failure.state.checksumSha256).toBe("a".repeat(64))
    })

    it("resumes from the failed step without re-hashing or re-creating the resource", async () => {
        const failing = happyDeps({
            createUploadUrl: vi.fn(async () => {
                throw new RestError("boom", 500)
            }),
        })
        const failure = await expectFlowFailure(runResourceUploadFlow(draftOf(), failing))
        expect(failure.reason).toBe("server")

        const resumed = happyDeps()
        const outcome = await runResourceUploadFlow(draftOf(), resumed, failure.state)

        expect(resumed.calls).toEqual(["uploadUrl", "put", "complete", "submit"])
        expect(resumed.hashFile).not.toHaveBeenCalled()
        expect(resumed.createResource).not.toHaveBeenCalled()
        expect(outcome.resource.id).toBe("res-1")
    })

    it("mints a FRESH presign when the transfer itself failed (the old URL may be expired)", async () => {
        const failing = happyDeps({
            putObject: vi.fn(async () => {
                throw new ResourceStoragePutError(403)
            }),
        })
        const failure = await expectFlowFailure(runResourceUploadFlow(draftOf(), failing))

        expect(failure.step).toBe("put")
        expect(failure.reason).toBe("storage")
        expect(failure.state.presignedPutUrl).toBeNull()
        expect(failure.state.versionId).toBeNull()
        expect(failure.state.uploaded).toBe(false)

        const resumed = happyDeps()
        await runResourceUploadFlow(draftOf(), resumed, failure.state)
        expect(resumed.calls).toEqual(["uploadUrl", "put", "complete", "submit"])
    })

    it("drops the version after a checksum mismatch on complete so the retry re-uploads", async () => {
        const state: ResourceUploadState = {
            ...emptyResourceUploadState(),
            checksumSha256: "c".repeat(64),
            sizeBytes: 9,
            resourceId: "res-1",
            versionId: "ver-1",
            presignedPutUrl: "https://s3/put",
            storageKey: "k",
            uploaded: true,
        }
        const resumeState = retryStateAfter("complete", state)

        expect(resumeState.versionId).toBeNull()
        expect(resumeState.uploaded).toBe(false)
        expect(nextResourceUploadStep(resumeState)).toBe("uploadUrl")
    })

    it("reports the failing step as errored to the progress callback", async () => {
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
        [new ResourceStoragePutError(500), "storage"],
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
