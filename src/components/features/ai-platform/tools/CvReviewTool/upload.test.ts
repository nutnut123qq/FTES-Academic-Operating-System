import { createHash } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Unit — the CV upload gate + presigned pipeline (`ai-hub-live-tools` task 4.5):
 *  - `validateCvFile` rejects a wrong type ("drops a .png → no upload starts")
 *    and an oversize file entirely client-side, accepting pdf/docx by MIME or —
 *    because some browsers report an empty `type` for `.docx` — by extension,
 *  - `uploadCvFileToStorage` runs presign → PUT (with the file + content type) →
 *    complete (with the hex SHA-256 checksum) and resolves the `storageKey`,
 *  - a failed presigned PUT throws and never calls `complete`.
 *
 * The platform REST fns are mocked; `fetch` is stubbed so no network is touched.
 */

const presignPlatformFileUpload = vi.fn()
const completePlatformFileUpload = vi.fn()
vi.mock("@/modules/api/rest/platform", () => ({
    presignPlatformFileUpload: (...a: Array<unknown>) => presignPlatformFileUpload(...a),
    completePlatformFileUpload: (...a: Array<unknown>) => completePlatformFileUpload(...a),
}))

import {
    CV_UPLOAD_MAX_BYTES,
    isCvFileValid,
    uploadCvFileToStorage,
    validateCvFile,
} from "./upload"

const PDF_MIME = "application/pdf"
const DOCX_MIME =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

const makeFile = (name: string, type: string, bytes: Uint8Array | number) => {
    // Copy into a fresh Uint8Array so TS sees a plain ArrayBuffer-backed view
    // (TextEncoder returns Uint8Array<ArrayBufferLike>, not a valid BlobPart).
    const content =
        typeof bytes === "number" ? new Uint8Array(bytes) : new Uint8Array(bytes)
    return new File([content], name, { type })
}

describe("validateCvFile", () => {
    it("accepts a pdf and a docx by MIME", () => {
        expect(validateCvFile(makeFile("cv.pdf", PDF_MIME, 10))).toBeNull()
        expect(validateCvFile(makeFile("cv.docx", DOCX_MIME, 10))).toBeNull()
    })

    it("accepts a .docx with an empty browser MIME by extension fallback", () => {
        expect(validateCvFile(makeFile("cv.docx", "", 10))).toBeNull()
        expect(isCvFileValid(makeFile("cv.pdf", "", 10))).toBe(true)
    })

    it("rejects a wrong type (png) so no upload ever starts", () => {
        expect(validateCvFile(makeFile("cv.png", "image/png", 10))).toBe("type")
        expect(isCvFileValid(makeFile("cv.png", "image/png", 10))).toBe(false)
    })

    it("rejects an over-10MB file", () => {
        const big = makeFile("cv.pdf", PDF_MIME, CV_UPLOAD_MAX_BYTES + 1)
        expect(validateCvFile(big)).toBe("size")
    })

    it("keeps a file exactly at the limit", () => {
        expect(validateCvFile(makeFile("cv.pdf", PDF_MIME, CV_UPLOAD_MAX_BYTES))).toBeNull()
    })
})

describe("uploadCvFileToStorage", () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
        presignPlatformFileUpload.mockReset()
        completePlatformFileUpload.mockReset()
        fetchMock.mockReset()
        vi.stubGlobal("fetch", fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("presigns, PUTs, completes with the sha256 checksum, and returns the storageKey", async () => {
        const bytes = new TextEncoder().encode("cv-content")
        const file = makeFile("cv.pdf", PDF_MIME, bytes)
        const expectedChecksum = createHash("sha256").update(bytes).digest("hex")

        presignPlatformFileUpload.mockResolvedValue({
            fileId: "file-1",
            uploadUrl: "https://storage.example/put/file-1",
            objectKey: "users/u1/cv.pdf",
        })
        fetchMock.mockResolvedValue({ ok: true, status: 200 })
        completePlatformFileUpload.mockResolvedValue(null)

        const storageKey = await uploadCvFileToStorage(file)

        expect(storageKey).toBe("users/u1/cv.pdf")
        expect(presignPlatformFileUpload).toHaveBeenCalledWith({
            fileName: "cv.pdf",
            contentType: PDF_MIME,
            sizeBytes: file.size,
            visibility: "PRIVATE",
        })
        expect(fetchMock).toHaveBeenCalledWith("https://storage.example/put/file-1", {
            method: "PUT",
            headers: { "Content-Type": PDF_MIME },
            body: file,
        })
        expect(completePlatformFileUpload).toHaveBeenCalledWith("file-1", {
            checksumSha256: expectedChecksum,
        })
    })

    it("throws on a failed presigned PUT and never calls complete", async () => {
        const file = makeFile("cv.pdf", PDF_MIME, new TextEncoder().encode("x"))
        presignPlatformFileUpload.mockResolvedValue({
            fileId: "file-2",
            uploadUrl: "https://storage.example/put/file-2",
            objectKey: "users/u1/cv2.pdf",
        })
        fetchMock.mockResolvedValue({ ok: false, status: 403 })

        await expect(uploadCvFileToStorage(file)).rejects.toThrow("Upload failed (403)")
        expect(completePlatformFileUpload).not.toHaveBeenCalled()
    })
})
