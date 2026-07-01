"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { debounce } from "lodash"
import { ChallengeSubmissionEntity } from "@/modules/types/entities/challenge-submission"
import { SubmissionType } from "@/modules/types/enums/submission-type"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setLoadingChallengeSubmissionIds } from "@/redux/slices/challenge"
import { useChallengeOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useMutateSyncChallengeSubmissionSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSyncChallengeSubmissionSwr"
import { useQueryChallengeSubmissionsSwr } from "@/hooks/swr/api/graphql/queries/useQueryChallengeSubmissionsSwr"
import { useGraphQLWithToast } from "@/modules/toast/hooks"

/** GitHub URL regex. */
const GITHUB_REGEX = /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+(\/[A-Za-z0-9_.-]+)?(\/)?$/
/** Google Docs URL regex. */
const GOOGLE_DOCS_REGEX = /^https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/[A-Za-z0-9_-]+/
const MSG_URL_REQUIRED = "challenge.submissionModal.errors.urlRequired"
const MSG_INVALID_GITHUB = "challenge.submissionModal.errors.invalidGithubUrl"
const MSG_INVALID_GOOGLE = "challenge.submissionModal.errors.invalidGoogleDocsUrl"

/** Inline auto-save status surfaced to the consumer for <100ms feedback. */
export type AutosaveStatus = "idle" | "saving" | "saved" | "failed"

/** Error for one submission row (nested shape like the old formik so consumers need no changes). */
interface RowError {
    /** Error for userSubmission. */
    userSubmission?: { submissionUrl?: string }
}
/** Touched state for one submission row. */
interface RowTouched {
    /** Touched state for userSubmission. */
    userSubmission?: { submissionUrl?: boolean }
}

/** Validate a URL by submission type; returns an i18n message or undefined. */
const validateUrl = (type: SubmissionType, url: string): string | undefined => {
    const trimmed = url.trim()
    if (!trimmed) {
        return MSG_URL_REQUIRED
    }
    if (type === SubmissionType.GithubUrl) {
        return GITHUB_REGEX.test(trimmed) ? undefined : MSG_INVALID_GITHUB
    }
    if (type === SubmissionType.GoogleDocsUrl) {
        return GOOGLE_DOCS_REGEX.test(trimmed) ? undefined : MSG_INVALID_GOOGLE
    }
    return undefined
}

/** Extract the row index from a field path like `submissions.{i}.userSubmission.submissionUrl`. */
const parseIndex = (fieldName: string): number => {
    const match = /^submissions\.(\d+)\./.exec(fieldName)
    return match ? Number(match[1]) : -1
}

/**
 * Submission-URL edit form (replaces the old formik) — NOT react-hook-form because it needs a nested
 * field-array + per-row debounced auto-sync; returns a formik-compatible shape (`values/errors/touched/...`)
 * so {@link ChallengeSubmissionPanel} keeps reading it the same way. Seeded from redux `challenge.challengeSubmissions`.
 * @returns a formik-like object: values/errors/touched/setFieldValue/setFieldTouched/isSubmitting.
 */
export const useEditSubmissionForm = () => {
    const challengeSubmissions = useAppSelector((state) => state.challenge.challengeSubmissions)
    const syncChallengeSubmissionsSwr = useMutateSyncChallengeSubmissionSwr()
    const queryChallengeSubmissionsSwr = useQueryChallengeSubmissionsSwr()
    const { isOpen } = useChallengeOverlayState()
    const dispatch = useAppDispatch()
    const runGraphQL = useGraphQLWithToast()

    /** User-typed URLs overriding the redux value, keyed by submission id. */
    const [urlOverrides, setUrlOverrides] = useState<Record<string, string>>({})
    /** Which fields are touched, keyed by submission id. */
    const [touchedMap, setTouchedMap] = useState<Record<string, boolean>>({})
    /** Inline auto-save status for debounced sync feedback. */
    const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle")

    const baseSubmissions = useMemo(() => challengeSubmissions ?? [], [challengeSubmissions])

    /** Displayed submissions = redux + URL overrides. */
    const submissions = useMemo<Array<ChallengeSubmissionEntity>>(
        () => baseSubmissions.map((submission) => {
            const overridden = urlOverrides[submission.id]
            if (overridden === undefined) {
                return submission
            }
            return {
                ...submission,
                userSubmission: {
                    ...submission.userSubmission,
                    submissionUrl: overridden,
                },
            } as ChallengeSubmissionEntity
        }),
        [baseSubmissions, urlOverrides],
    )

    /** errors.submissions[i].userSubmission.submissionUrl (aligned with the submissions order). */
    const errorSubmissions = useMemo<Array<RowError | undefined>>(
        () => submissions.map((submission) => {
            const message = validateUrl(submission.type, submission.userSubmission?.submissionUrl ?? "")
            return message ? { userSubmission: { submissionUrl: message } } : undefined
        }),
        [submissions],
    )

    const touchedSubmissions = useMemo<Array<RowTouched | undefined>>(
        () => submissions.map((submission) =>
            touchedMap[submission.id] ? { userSubmission: { submissionUrl: true } } : undefined),
        [submissions, touchedMap],
    )

    const setFieldValue = useCallback((fieldName: string, value: string) => {
        const index = parseIndex(fieldName)
        const submissionId = baseSubmissions[index]?.id
        if (!submissionId) {
            return
        }
        setUrlOverrides((prev) => ({ ...prev, [submissionId]: value }))
    }, [baseSubmissions])

    const setFieldTouched = useCallback((fieldName: string, _touched = true) => {
        const index = parseIndex(fieldName)
        const submissionId = baseSubmissions[index]?.id
        if (!submissionId) {
            return
        }
        setTouchedMap((prev) => ({ ...prev, [submissionId]: _touched }))
    }, [baseSubmissions])

    // Debounced auto-sync of changed URLs (replaces the formik core's syncRef logic). Skip the first mount.
    const mountedRef = useRef(false)
    const syncRef = useRef<() => void>(() => undefined)
    syncRef.current = () => {
        if (!isOpen) {
            return
        }
        const changed = submissions.filter((submission) => {
            const initial = baseSubmissions.find((candidate) => candidate.id === submission.id)
            const urlChanged = submission.userSubmission?.submissionUrl !== initial?.userSubmission?.submissionUrl
            if (!urlChanged) {
                return false
            }
            // PER-ROW guard: only auto-save a row whose OWN url is non-empty + valid.
            // (the old global `hasErrors` gate blocked EVERY row whenever ANY requirement
            // was still empty/invalid — so with >1 requirement a typed URL never persisted
            // across submissions / F5. Each valid row now saves independently.)
            const url = submission.userSubmission?.submissionUrl ?? ""
            return url.length > 0 && !validateUrl(submission.type, url)
        })
        if (changed.length === 0) {
            return
        }
        const items = changed.map((submission) => ({
            id: submission.id,
            url: submission.userSubmission?.submissionUrl ?? "",
        }))
        dispatch(setLoadingChallengeSubmissionIds(items.map((item) => item.id)))
        setAutosaveStatus("saving")
        Promise.allSettled(items.map((item) => runGraphQL(
            async () => {
                const response = await syncChallengeSubmissionsSwr.trigger(item)
                const result = response.data?.syncSubmission
                if (!result?.success) {
                    throw new Error(response.error?.message)
                }
                return result
            },
            { showSuccessToast: false },
        )))
            .then((results) => {
                // runGraphQL never throws: it resolves `true` on success and `false` on error
                // (the error toast is already shown there). Mark saved only if every item succeeded.
                const allSaved = results.every(
                    (outcome) => outcome.status === "fulfilled" && outcome.value === true,
                )
                setAutosaveStatus(allSaved ? "saved" : "failed")
                return queryChallengeSubmissionsSwr.mutate()
            })
            .finally(() => dispatch(setLoadingChallengeSubmissionIds([])))
    }

    const debouncedSync = useMemo(() => debounce(() => syncRef.current(), 300), [])
    useEffect(() => () => debouncedSync.cancel(), [debouncedSync])
    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true
            return
        }
        debouncedSync()
    }, [urlOverrides, debouncedSync])

    return {
        values: { submissions },
        errors: { submissions: errorSubmissions },
        touched: { submissions: touchedSubmissions },
        setFieldValue,
        setFieldTouched,
        isSubmitting: false,
        autosaveStatus,
    }
}
