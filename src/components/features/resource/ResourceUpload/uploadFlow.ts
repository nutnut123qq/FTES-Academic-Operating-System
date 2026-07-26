/**
 * Chuoi dang hoc lieu THAT (BE `ResourceController` + `ResourceService`):
 *
 * ```
 * create -> POST /resources               -> hoc lieu DRAFT
 * upload -> POST /resources/{id}/versions -> multipart (field `file`); BE tu tinh checksum +
 *                                            kich thuoc va set currentVersionId
 * submit -> POST /resources/{id}/submit   -> PENDING_APPROVAL (vao hang doi duyet)
 * ```
 *
 * Van la state machine resume duoc: moi buoc ghi lai thu no tao ra trong
 * {@link ResourceUploadState}, nen hong giua duong thi thu lai DUNG buoc do, khong tao lai hoc lieu.
 *
 * Truoc 2026-07-26 chuoi nay di presign 4 buoc (hash -> upload-url -> PUT -> complete). BE da GO
 * `/versions/upload-url` khi chuyen sang Cloudinary: goi vao tra 404 PLATFORM_NOT_FOUND, nen moi
 * luot upload tren UI deu tao ra hoc lieu RONG (khong version => khong tai xuong duoc, panel hoi AI
 * bi an). Do la ly do chuoi rut con 3 buoc.
 */
import {
    createResource,
    submitResource,
    uploadResourceVersion,
    type CreateResourceRequest,
    type ResourceResponse,
    type VersionResponse,
} from "@/modules/api/rest/resource"
import { RestError } from "@/modules/api/rest/client"

import type { ResourceTypeCode } from "./uploadRules"

/** One step of the publish chain, in execution order. */
export type ResourceUploadStep = "create" | "upload" | "submit"

/** The chain in order — the progress list renders straight off this. */
export const RESOURCE_UPLOAD_STEPS: ReadonlyArray<ResourceUploadStep> = [
    "create",
    "upload",
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
    resourceId: string | null
    versionId: string | null
    submitted: boolean
}

/** A pristine state — nothing has run yet. */
export const emptyResourceUploadState = (): ResourceUploadState => ({
    resourceId: null,
    versionId: null,
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
    if (state.resourceId === null) return "create"
    if (state.versionId === null) return "upload"
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
 * State de thu lai sau khi `step` hong. Upload multipart la MOT request nguyen khoi nen hong thi
 * thu lai dung buoc do (versionId van null); cac buoc khac cung retry tai cho.
 */
export const retryStateAfter = (
    step: ResourceUploadStep,
    state: ResourceUploadState,
): ResourceUploadState => {
    if (step === "upload") {
        return { ...state, versionId: null }
    }
    return state
}

/** Injection seam — the unit test swaps every one of these for a spy. */
export interface ResourceUploadDeps {
    createResource: (request: CreateResourceRequest) => Promise<ResourceResponse>
    uploadVersion: (id: string, file: File, changelog?: string) => Promise<VersionResponse>
    submitResource: (id: string) => Promise<ResourceResponse>
    onStep?: (
        step: ResourceUploadStep,
        status: ResourceUploadStepStatus,
        state: ResourceUploadState,
    ) => void
}

/** Production wiring of {@link ResourceUploadDeps}. */
export const defaultResourceUploadDeps: Omit<ResourceUploadDeps, "onStep"> = {
    createResource,
    uploadVersion: uploadResourceVersion,
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
        case "upload": {
            const version = await deps.uploadVersion(
                state.resourceId as string,
                draft.file,
                draft.changelog?.trim() || undefined,
            )
            return { state: { ...state, versionId: version.id } }
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
