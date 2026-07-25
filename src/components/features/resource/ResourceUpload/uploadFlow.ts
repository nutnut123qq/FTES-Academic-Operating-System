/**
 * The real resource-publish chain (BE `ResourceController` + `ResourceService`):
 *
 * ```
 * hash      → SHA-256 of the bytes (WebCrypto)   — required BEFORE the presign call:
 *                                                  `UploadUrlRequest.checksumSha256`
 *                                                  is @NotBlank @Size(min=64,max=64)
 * create    → POST /resources                    → DRAFT resource
 * uploadUrl → POST /resources/{id}/versions/upload-url
 *                                                → {versionId, presignedPutUrl, storageKey}
 * put       → PUT presignedPutUrl (raw bytes, exact Content-Type the presign was signed with)
 * complete  → POST /resources/versions/{versionId}/complete
 *                                                → BE re-stats the object and compares
 *                                                  size + checksum, then sets currentVersionId
 * submit    → POST /resources/{id}/submit        → PENDING_APPROVAL (moderation workflow)
 * ```
 *
 * The chain is written as a **resumable state machine** rather than a straight-line
 * `await` sequence: every step records what it produced in {@link ResourceUploadState},
 * so a failure half-way (a 429 on presign, a dropped PUT, a 5xx on submit) can be
 * retried from exactly the step that failed without re-creating the resource or
 * re-hashing hundreds of MB.
 */

import {
    completeResourceUpload,
    createResource,
    createResourceUploadUrl,
    submitResource,
    type CompleteUploadRequest,
    type CreateResourceRequest,
    type ResourceResponse,
    type ResourceUploadUrlRequest,
    type ResourceUploadUrlResponse,
    type VersionResponse,
} from "@/modules/api/rest/resource"
import { RestError } from "@/modules/api/rest/client"

import type { ResourceTypeCode } from "./uploadRules"

/** One step of the publish chain, in execution order. */
export type ResourceUploadStep =
    | "hash"
    | "create"
    | "uploadUrl"
    | "put"
    | "complete"
    | "submit"

/** The chain in order — the progress list renders straight off this. */
export const RESOURCE_UPLOAD_STEPS: ReadonlyArray<ResourceUploadStep> = [
    "hash",
    "create",
    "uploadUrl",
    "put",
    "complete",
    "submit",
]

/** Lifecycle of a single step as reported to {@link ResourceUploadDeps.onStep}. */
export type ResourceUploadStepStatus = "running" | "done" | "error"

/** What the user filled in, plus the MIME resolved by `validateResourceFile`. */
export interface ResourceUploadDraft {
    file: File
    title: string
    description?: string
    type: ResourceTypeCode
    subjectId: string
    /** BE `Visibility` enum name — defaults to `MEMBERS` server-side when omitted. */
    visibility?: string
    /** BE `License` enum name — defaults to `ALL_RIGHTS_RESERVED` server-side. */
    license?: string
    /** Optional per-version note (`UploadUrlRequest.changelog`). */
    changelog?: string
    /** MIME accepted by the type whitelist — see `resolveResourceMimeType`. */
    mimeType: string
}

/** Everything the chain has produced so far. Serializable ⇒ trivially resumable. */
export interface ResourceUploadState {
    checksumSha256: string | null
    sizeBytes: number | null
    resourceId: string | null
    versionId: string | null
    presignedPutUrl: string | null
    storageKey: string | null
    uploaded: boolean
    completed: boolean
    submitted: boolean
}

/** A pristine state — nothing has run yet. */
export const emptyResourceUploadState = (): ResourceUploadState => ({
    checksumSha256: null,
    sizeBytes: null,
    resourceId: null,
    versionId: null,
    presignedPutUrl: null,
    storageKey: null,
    uploaded: false,
    completed: false,
    submitted: false,
})

/**
 * The next step to run for a given state, or `null` when the chain is finished.
 * Pure — this IS the state machine's transition table, and the unit test drives it
 * directly.
 */
export const nextResourceUploadStep = (
    state: ResourceUploadState,
): ResourceUploadStep | null => {
    if (state.checksumSha256 === null || state.sizeBytes === null) return "hash"
    if (state.resourceId === null) return "create"
    if (state.versionId === null || state.presignedPutUrl === null) return "uploadUrl"
    if (!state.uploaded) return "put"
    if (!state.completed) return "complete"
    if (!state.submitted) return "submit"
    return null
}

/** How a failure should be worded for the user; maps to `upload.error.<reason>`. */
export type ResourceUploadErrorReason =
    | "auth"
    | "forbidden"
    | "notFound"
    | "rateLimited"
    | "tooLarge"
    | "checksum"
    | "invalidState"
    | "validation"
    | "storage"
    | "network"
    | "server"
    | "generic"

/** Raised when the presigned PUT itself fails (non-2xx from object storage). */
export class ResourceStoragePutError extends Error {
    readonly status: number

    constructor(status: number) {
        super(`Storage PUT failed (${status})`)
        this.name = "ResourceStoragePutError"
        this.status = status
    }
}

/**
 * A failure of one chain step, carrying the state to resume from.
 *
 * `state` is already adjusted for a retry: a failed `put`/`complete` clears the
 * presign so the retry mints a **fresh** upload URL (presigned URLs expire, and a
 * `RESOURCE_UPLOAD_INCOMPLETE` means the stored object does not match — both need a
 * new PUT target, not a replay of the old one).
 */
export class ResourceUploadError extends Error {
    readonly step: ResourceUploadStep
    readonly reason: ResourceUploadErrorReason
    readonly state: ResourceUploadState
    readonly status: number

    constructor(
        step: ResourceUploadStep,
        reason: ResourceUploadErrorReason,
        state: ResourceUploadState,
        status: number,
        message: string,
    ) {
        super(message)
        this.name = "ResourceUploadError"
        this.step = step
        this.reason = reason
        this.state = state
        this.status = status
    }
}

/** Domain error codes thrown by `ResourceException` mapped to a user-facing reason. */
const ERROR_CODE_REASONS: Record<string, ResourceUploadErrorReason> = {
    RESOURCE_NOT_FOUND: "notFound",
    RESOURCE_ACCESS_DENIED: "forbidden",
    RESOURCE_INVALID_STATE: "invalidState",
    RESOURCE_UPLOAD_INCOMPLETE: "checksum",
    RESOURCE_FILE_TOO_LARGE: "tooLarge",
    RESOURCE_VALIDATION: "validation",
    RESOURCE_RATE_LIMITED: "rateLimited",
}

/** Classifies any thrown value into a user-facing reason. Exported for the test. */
export const classifyResourceUploadError = (
    error: unknown,
): { reason: ResourceUploadErrorReason; status: number; message: string } => {
    if (error instanceof ResourceStoragePutError) {
        return {
            reason: error.status === 0 ? "network" : "storage",
            status: error.status,
            message: error.message,
        }
    }
    if (error instanceof RestError) {
        const byCode = error.errorCode ? ERROR_CODE_REASONS[error.errorCode] : undefined
        if (byCode) {
            return { reason: byCode, status: error.status, message: error.message }
        }
        if (error.status === 0) {
            return { reason: "network", status: 0, message: error.message }
        }
        if (error.status === 401) {
            return { reason: "auth", status: 401, message: error.message }
        }
        if (error.status === 403) {
            return { reason: "forbidden", status: 403, message: error.message }
        }
        if (error.status === 404) {
            return { reason: "notFound", status: 404, message: error.message }
        }
        if (error.status === 413) {
            return { reason: "tooLarge", status: 413, message: error.message }
        }
        if (error.status === 429) {
            return { reason: "rateLimited", status: 429, message: error.message }
        }
        if (error.status >= 500) {
            return { reason: "server", status: error.status, message: error.message }
        }
        return { reason: "generic", status: error.status, message: error.message }
    }
    const message = error instanceof Error ? error.message : String(error)
    // A rejected `fetch` (offline / CORS / aborted) is a TypeError, not a RestError.
    if (error instanceof TypeError) {
        return { reason: "network", status: 0, message }
    }
    return { reason: "generic", status: 0, message }
}

/**
 * State to resume from after `step` failed. A failed transfer (`put`) or a rejected
 * `complete` invalidates the presign, so both drop back to `uploadUrl`; every other
 * step is retried in place.
 */
export const retryStateAfter = (
    step: ResourceUploadStep,
    state: ResourceUploadState,
): ResourceUploadState => {
    if (step === "put" || step === "complete") {
        return {
            ...state,
            versionId: null,
            presignedPutUrl: null,
            storageKey: null,
            uploaded: false,
            completed: false,
        }
    }
    return state
}

/** Injection seam — the unit test swaps every one of these for a spy. */
export interface ResourceUploadDeps {
    hashFile: (file: File) => Promise<string>
    createResource: (request: CreateResourceRequest) => Promise<ResourceResponse>
    createUploadUrl: (
        id: string,
        request: ResourceUploadUrlRequest,
    ) => Promise<ResourceUploadUrlResponse>
    putObject: (url: string, file: File, contentType: string) => Promise<void>
    completeUpload: (
        versionId: string,
        request: CompleteUploadRequest,
    ) => Promise<VersionResponse>
    submitResource: (id: string) => Promise<ResourceResponse>
    onStep?: (
        step: ResourceUploadStep,
        status: ResourceUploadStepStatus,
        state: ResourceUploadState,
    ) => void
}

/** Hex SHA-256 of the file bytes — the checksum both BE steps verify. */
export const sha256HexOfFile = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const digest = await crypto.subtle.digest("SHA-256", buffer)
    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
}

/**
 * Uploads the raw bytes to the presigned URL.
 *
 * The `Content-Type` MUST equal the MIME the presign was signed with
 * (`S3StorageAdapter.presignedPutUrl` puts it in the signature) — a different header
 * makes S3 answer 403 SignatureDoesNotMatch.
 */
export const putResourceObject = async (
    url: string,
    file: File,
    contentType: string,
): Promise<void> => {
    const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
    })
    if (!response.ok) {
        throw new ResourceStoragePutError(response.status)
    }
}

/** Production wiring of {@link ResourceUploadDeps}. */
export const defaultResourceUploadDeps: Omit<ResourceUploadDeps, "onStep"> = {
    hashFile: sha256HexOfFile,
    createResource,
    createUploadUrl: createResourceUploadUrl,
    putObject: putResourceObject,
    completeUpload: completeResourceUpload,
    submitResource,
}

/** What a fully finished chain hands back. */
export interface ResourceUploadResult {
    state: ResourceUploadState
    /** The resource after `submit` (status `PENDING_APPROVAL`). */
    resource: ResourceResponse
}

/** Runs one step and returns the state it produced. Never mutates `state`. */
const runStep = async (
    step: ResourceUploadStep,
    draft: ResourceUploadDraft,
    deps: ResourceUploadDeps,
    state: ResourceUploadState,
): Promise<{ state: ResourceUploadState; resource?: ResourceResponse }> => {
    switch (step) {
        case "hash": {
            const checksumSha256 = await deps.hashFile(draft.file)
            return {
                state: { ...state, checksumSha256, sizeBytes: draft.file.size },
            }
        }
        case "create": {
            const resource = await deps.createResource({
                title: draft.title.trim(),
                description: draft.description?.trim() || undefined,
                type: draft.type,
                subjectId: draft.subjectId,
                visibility: draft.visibility,
                license: draft.license,
            })
            return { state: { ...state, resourceId: resource.id }, resource }
        }
        case "uploadUrl": {
            const presigned = await deps.createUploadUrl(state.resourceId as string, {
                filename: draft.file.name,
                mimeType: draft.mimeType,
                sizeBytes: state.sizeBytes as number,
                checksumSha256: state.checksumSha256 as string,
                changelog: draft.changelog?.trim() || undefined,
            })
            return {
                state: {
                    ...state,
                    versionId: presigned.versionId,
                    presignedPutUrl: presigned.presignedPutUrl,
                    storageKey: presigned.storageKey,
                },
            }
        }
        case "put": {
            await deps.putObject(
                state.presignedPutUrl as string,
                draft.file,
                draft.mimeType,
            )
            return { state: { ...state, uploaded: true } }
        }
        case "complete": {
            await deps.completeUpload(state.versionId as string, {
                checksumSha256: state.checksumSha256 as string,
                sizeBytes: state.sizeBytes as number,
            })
            return { state: { ...state, completed: true } }
        }
        case "submit": {
            const resource = await deps.submitResource(state.resourceId as string)
            return { state: { ...state, submitted: true }, resource }
        }
    }
}

/**
 * Drives the publish chain to completion, resuming from `initialState`.
 *
 * @param draft - the validated form payload (`mimeType` must come from
 * `validateResourceFile`, never from `File.type` directly).
 * @param deps - API seam; pass {@link defaultResourceUploadDeps} in the app.
 * @param initialState - progress from a previous failed attempt; omit to start fresh.
 * @returns the final state + the submitted resource.
 * @throws {ResourceUploadError} carrying the failed step and the state to retry from.
 */
export const runResourceUploadFlow = async (
    draft: ResourceUploadDraft,
    deps: ResourceUploadDeps,
    initialState?: ResourceUploadState,
): Promise<ResourceUploadResult> => {
    let state = initialState ?? emptyResourceUploadState()
    let resource: ResourceResponse | null = null

    // Bounded: `nextResourceUploadStep` advances monotonically, the cap is a guard
    // against a future transition-table bug looping forever in the browser.
    for (let guard = 0; guard <= RESOURCE_UPLOAD_STEPS.length; guard += 1) {
        const step = nextResourceUploadStep(state)
        if (step === null) {
            if (resource === null) {
                throw new ResourceUploadError(
                    "submit",
                    "generic",
                    state,
                    0,
                    "Upload finished without a resource payload",
                )
            }
            return { state, resource }
        }

        deps.onStep?.(step, "running", state)
        try {
            const outcome = await runStep(step, draft, deps, state)
            state = outcome.state
            if (outcome.resource) {
                resource = outcome.resource
            }
            deps.onStep?.(step, "done", state)
        } catch (error) {
            const { reason, status, message } = classifyResourceUploadError(error)
            const resumeState = retryStateAfter(step, state)
            deps.onStep?.(step, "error", resumeState)
            throw new ResourceUploadError(step, reason, resumeState, status, message)
        }
    }

    throw new ResourceUploadError(
        "submit",
        "generic",
        state,
        0,
        "Upload flow did not terminate",
    )
}
