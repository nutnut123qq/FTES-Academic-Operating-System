"use client"

import { useCallback, useRef, useState } from "react"
import useSWRMutation from "swr/mutation"

import {
    RESOURCE_UPLOAD_STEPS,
    ResourceUploadError,
    defaultResourceUploadDeps,
    emptyResourceUploadState,
    nextResourceUploadStep,
    runResourceUploadFlow,
    type ResourceUploadDraft,
    type ResourceUploadResult,
    type ResourceUploadState,
    type ResourceUploadStep,
    type ResourceUploadStepStatus,
} from "./uploadFlow"

/** Per-step row of the progress list. */
export interface ResourceUploadStepView {
    step: ResourceUploadStep
    status: ResourceUploadStepStatus | "idle"
}

/**
 * Progress rows for a state: every step BEFORE the next one to run is already done
 * (so a retry keeps the green ticks of the work that survived the failure).
 */
export const resourceUploadStepViews = (
    state: ResourceUploadState,
): Array<ResourceUploadStepView> => {
    const next = nextResourceUploadStep(state)
    const boundary = next === null ? RESOURCE_UPLOAD_STEPS.length : RESOURCE_UPLOAD_STEPS.indexOf(next)
    return RESOURCE_UPLOAD_STEPS.map((step, index) => ({
        step,
        status: index < boundary ? "done" : "idle",
    }))
}

/**
 * Runs the resource publish chain as ONE SWR mutation (`useSWRMutation`), keeping the
 * per-step progress and the resume state so a failure can be retried from the step
 * that failed instead of restarting the whole chain (no second resource row, no
 * re-hashing a 500MB video).
 *
 * `run`/`retry` never reject — the failure is surfaced through `error`, a
 * {@link ResourceUploadError} whose `reason` maps to an `upload.error.<reason>`
 * message and whose `step` is highlighted in the progress list.
 */
export const useResourceUploadFlow = () => {
    /** Progress carried across retries; reset by {@link reset}. */
    const stateRef = useRef<ResourceUploadState>(emptyResourceUploadState())
    /** Last submitted draft, so `retry()` needs no arguments. */
    const draftRef = useRef<ResourceUploadDraft | null>(null)

    const [steps, setSteps] = useState<Array<ResourceUploadStepView>>(() =>
        resourceUploadStepViews(emptyResourceUploadState()),
    )
    const [error, setError] = useState<ResourceUploadError | null>(null)
    const [result, setResult] = useState<ResourceUploadResult | null>(null)

    const markStep = useCallback(
        (step: ResourceUploadStep, status: ResourceUploadStepStatus) => {
            setSteps((current) =>
                current.map((row) => (row.step === step ? { ...row, status } : row)),
            )
        },
        [],
    )

    const { trigger, isMutating } = useSWRMutation<
        ResourceUploadResult,
        ResourceUploadError,
        "RESOURCE_UPLOAD_FLOW",
        ResourceUploadDraft
    >("RESOURCE_UPLOAD_FLOW", async (_key, { arg }) =>
        runResourceUploadFlow(
            arg,
            {
                ...defaultResourceUploadDeps,
                onStep: (step, status, state) => {
                    stateRef.current = state
                    markStep(step, status)
                },
            },
            stateRef.current,
        ),
    )

    const run = useCallback(
        async (draft: ResourceUploadDraft): Promise<ResourceUploadResult | null> => {
            draftRef.current = draft
            setError(null)
            setSteps(resourceUploadStepViews(stateRef.current))
            try {
                const outcome = await trigger(draft)
                stateRef.current = outcome.state
                setResult(outcome)
                return outcome
            } catch (thrown) {
                const failure =
                    thrown instanceof ResourceUploadError
                        ? thrown
                        : new ResourceUploadError(
                              "submit",
                              "generic",
                              stateRef.current,
                              0,
                              thrown instanceof Error ? thrown.message : String(thrown),
                          )
                stateRef.current = failure.state
                setError(failure)
                return null
            }
        },
        [trigger],
    )

    /** Re-runs the chain from the step that failed, reusing the last draft. */
    const retry = useCallback(async (): Promise<ResourceUploadResult | null> => {
        const draft = draftRef.current
        return draft ? run(draft) : null
    }, [run])

    /** Clears progress + result so the form can start a brand-new upload. */
    const reset = useCallback(() => {
        stateRef.current = emptyResourceUploadState()
        draftRef.current = null
        setSteps(resourceUploadStepViews(emptyResourceUploadState()))
        setError(null)
        setResult(null)
    }, [])

    return {
        run,
        retry,
        reset,
        steps,
        error,
        result,
        isRunning: isMutating,
        /** A previous attempt failed and its draft is still around ⇒ retry is offered. */
        canRetry: error !== null && draftRef.current !== null,
    }
}
