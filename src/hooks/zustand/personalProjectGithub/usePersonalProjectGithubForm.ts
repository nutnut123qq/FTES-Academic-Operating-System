"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { debounce } from "lodash"
import { useTranslations } from "next-intl"
import { SidebarTab } from "@/redux/slices/sidebar"
import { usePersonalProjectGithubStore, type GradingModelSelection, type PersonalProjectGithubAutosaveStatus } from "./store"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { addMilestoneTaskIdToJobId } from "@/redux/slices/milestone"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { useMutateReviewPersonalProjectTaskSwr } from "@/hooks/swr/api/graphql/mutations/useMutateReviewPersonalProjectTaskSwr"
import { useQueryAiModelsSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiModelsSwr"
import { useQueryMyAiSettingsSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiSettingsSwr"
import { AiMode } from "@/modules/api/graphql/queries/query-my-ai-settings"
import { AiModelCategory } from "@/modules/api/graphql/queries/query-ai-models"
import type { AiGradableModel } from "@/modules/api/graphql/queries/types/ai-models"
import { useMutateSyncPersonalProjectGithubBranchSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSyncPersonalProjectGithubBranchSwr"
import { useMutateSyncPersonalProjectGithubSwr } from "@/hooks/swr/api/graphql/mutations/useMutateSyncPersonalProjectGithubSwr"
import { useQueryCourseEnrollmentStatusSwr } from "@/hooks/swr/api/graphql/queries/useQueryCourseEnrollmentStatusSwr"

/** GitHub repo regex (aligned with the challenge submission rule). */
const GITHUB_REGEX = /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+(\/[A-Za-z0-9_.-]+)?(\/)?$/
const DEFAULT_BRANCH = "main"

/**
 * Pick a default grading model — Economy and up only (the personal project never grades on the
 * free Auto lane). Prefers the first AVAILABLE Economy model (cheapest valid), else the first
 * available model in the (already Economy+) list. Economy → `auto` unless the user can use the
 * Premium lane; Balanced/Premium → `premium`.
 */
const pickDefaultGradingModel = (
    models: Array<AiGradableModel>,
    canPremium: boolean,
): GradingModelSelection | null => {
    if (models.length === 0) {
        return null
    }
    // Only models the user can actually submit: an available Economy model (usable on any plan),
    // or — when entitled — any available higher-tier model. Prefer the cheapest (Economy).
    const usable = models.filter(
        (model) => model.available
            && (model.category === AiModelCategory.Economy || canPremium),
    )
    const target =
        usable.find((model) => model.category === AiModelCategory.Economy)
        ?? usable[0]
    if (!target) {
        return null
    }
    return {
        mode: canPremium ? AiMode.Premium : AiMode.Auto,
        model: target.model,
        provider: target.provider,
    }
}

/** Autosave status for the debounced url/branch sync (inline feedback). Lives in the store. */
export type { PersonalProjectGithubAutosaveStatus } from "./store"

/** Options for {@link usePersonalProjectGithubForm}. */
export interface UsePersonalProjectGithubFormOptions {
    /** Enable the 2 debounced auto-syncs (only the OWNER component — Submission — enables it, to avoid double-firing). */
    enableSync?: boolean
}

/**
 * Personal-project GitHub form hook — state SHARED via {@link usePersonalProjectGithubStore}.
 * Validated inline; submit runs the AI review (job settlement surfaces via refetch — the legacy
 * socket.io job channel had no server and was removed). `enableSync` turns on the
 * debounced url/branch sync (only one component enables it so we never sync twice).
 * @param options - {@link UsePersonalProjectGithubFormOptions}
 */
export const usePersonalProjectGithubForm = (options: UsePersonalProjectGithubFormOptions = {}) => {
    const { enableSync = false } = options
    const t = useTranslations()
    const dispatch = useAppDispatch()
    const runGraphQL = useGraphQLWithToast()
    const course = useAppSelector((state) => state.course.entity)
    const enrollment = useAppSelector((state) => state.user.enrollment)
    const sidebarTab = useAppSelector((state) => state.sidebar.sidebar.tab)
    const selectedTaskId = useAppSelector((state) => state.milestone.selectedTaskId)

    const syncPersonalProjectGithubSwr = useMutateSyncPersonalProjectGithubSwr()
    const syncBranchSwr = useMutateSyncPersonalProjectGithubBranchSwr()
    const queryCourseEnrollmentStatusSwr = useQueryCourseEnrollmentStatusSwr()
    const reviewPersonalProjectTaskSwr = useMutateReviewPersonalProjectTaskSwr()

    // Grading model catalog + entitlement. Economy and up only — the personal project never
    // grades on the free Auto lane. SWR dedupes across the panel + drawer instances.
    const aiModelsSwr = useQueryAiModelsSwr()
    const myAiSettingsSwr = useQueryMyAiSettingsSwr()
    const canPremium = Boolean(myAiSettingsSwr.data?.canPremium)
    const gradeModels = useMemo<Array<AiGradableModel>>(
        () => (aiModelsSwr.data?.aiModels?.data?.gradableModels ?? [])
            .filter((model) => model.category !== AiModelCategory.Free),
        [aiModelsSwr.data],
    )

    // SWR exposes STABLE trigger/mutate fns; the debounced-sync effects depend on
    // THESE, not the whole hook objects — otherwise every `isMutating` flip during a
    // sync changed the object identity, re-ran the effect, and re-fired the sync in a
    // loop that tripped the backend rate limiter (ThrottlerException: Too Many Requests).
    const syncGithubTrigger = syncPersonalProjectGithubSwr.trigger
    const syncBranchTrigger = syncBranchSwr.trigger
    const mutateEnrollmentStatus = queryCourseEnrollmentStatusSwr.mutate

    const githubUrl = usePersonalProjectGithubStore((state) => state.githubUrl)
    const branch = usePersonalProjectGithubStore((state) => state.branch)
    const lang = usePersonalProjectGithubStore((state) => state.lang)
    const touchedGithubUrl = usePersonalProjectGithubStore((state) => state.touchedGithubUrl)
    const touchedBranch = usePersonalProjectGithubStore((state) => state.touchedBranch)
    const githubUrlError = usePersonalProjectGithubStore((state) => state.githubUrlError)
    const branchError = usePersonalProjectGithubStore((state) => state.branchError)
    const isSubmitting = usePersonalProjectGithubStore((state) => state.isSubmitting)
    const seeded = usePersonalProjectGithubStore((state) => state.seeded)
    const gradeMode = usePersonalProjectGithubStore((state) => state.gradeMode)
    const gradeModel = usePersonalProjectGithubStore((state) => state.gradeModel)
    const gradeModelProvider = usePersonalProjectGithubStore((state) => state.gradeModelProvider)
    const setGithubUrl = usePersonalProjectGithubStore((state) => state.setGithubUrl)
    const setBranch = usePersonalProjectGithubStore((state) => state.setBranch)
    const setLang = usePersonalProjectGithubStore((state) => state.setLang)
    const setGradeSelection = usePersonalProjectGithubStore((state) => state.setGradeSelection)
    const setTouchedGithubUrl = usePersonalProjectGithubStore((state) => state.setTouchedGithubUrl)
    const setTouchedBranch = usePersonalProjectGithubStore((state) => state.setTouchedBranch)
    const setGithubUrlError = usePersonalProjectGithubStore((state) => state.setGithubUrlError)
    const setBranchError = usePersonalProjectGithubStore((state) => state.setBranchError)
    const setIsSubmitting = usePersonalProjectGithubStore((state) => state.setIsSubmitting)
    const seed = usePersonalProjectGithubStore((state) => state.seed)
    // url/branch autosave status live in the shared store so the field (which can render
    // in the settings Drawer) reads the same status the sync OWNER (panel) writes.
    const urlAutosaveStatus = usePersonalProjectGithubStore((state) => state.urlAutosaveStatus)
    const branchAutosaveStatus = usePersonalProjectGithubStore((state) => state.branchAutosaveStatus)
    const setUrlAutosaveStatus = usePersonalProjectGithubStore((state) => state.setUrlAutosaveStatus)
    const setBranchAutosaveStatus = usePersonalProjectGithubStore((state) => state.setBranchAutosaveStatus)

    // Seed once from enrollment (replaces enableReinitialize).
    useEffect(() => {
        if (seeded || !enrollment) {
            return
        }
        seed(
            enrollment.personalProjectGithubUrl ?? "",
            enrollment.personalProjectGithubBranch?.trim() || DEFAULT_BRANCH,
        )
    }, [seeded, enrollment, seed])

    /** Current grading-lane + model pick (Economy+ — never the free Auto lane). */
    const gradeSelection = useMemo<GradingModelSelection>(
        () => ({ mode: gradeMode, model: gradeModel, provider: gradeModelProvider }),
        [gradeMode, gradeModel, gradeModelProvider],
    )

    // Seed a default model once the catalog is available (so submit never falls back to the free
    // Auto lane). Only seeds when nothing has been picked yet.
    useEffect(() => {
        if (gradeModel || gradeModels.length === 0) {
            return
        }
        const fallback = pickDefaultGradingModel(gradeModels, canPremium)
        if (fallback) {
            setGradeSelection(fallback)
        }
    }, [gradeModel, gradeModels, canPremium, setGradeSelection])

    // Inline validation errors (combined with manual errors from sync/submit below).
    const validationError = useMemo(() => {
        const url = githubUrl.trim()
        let urlErr: string | null = null
        if (!url) {
            urlErr = t("finalProject.page.submitGithub.urlRequired")
        } else if (!GITHUB_REGEX.test(url)) {
            urlErr = t("finalProject.page.submitGithub.urlInvalidGithub")
        }
        const br = branch.trim()
        let branchErr: string | null = null
        if (br.length > 255) {
            branchErr = t("finalProject.page.submitGithub.branchTooLong")
        } else if (!/^$|^[a-zA-Z0-9._/-]+$/.test(br)) {
            branchErr = t("finalProject.page.submitGithub.branchInvalid")
        }
        return { githubUrl: urlErr, branch: branchErr }
    }, [githubUrl, branch, t])

    const errors = {
        githubUrl: githubUrlError ?? validationError.githubUrl,
        branch: branchError ?? validationError.branch,
    }

    const initialUrlRef = useRef(enrollment?.personalProjectGithubUrl?.trim() ?? "")
    const initialBranchRef = useRef(enrollment?.personalProjectGithubBranch?.trim() || DEFAULT_BRANCH)

    // Debounced URL sync (only when enableSync + PersonalProject tab + valid + changed vs enrollment).
    useEffect(() => {
        if (!enableSync || sidebarTab !== SidebarTab.PersonalProject || !course?.id) {
            return
        }
        if (validationError.githubUrl) {
            return
        }
        const trimmed = githubUrl.trim()
        // skip when it matches what we LAST synced — without this the effect's re-runs
        // (enrollment refetch after a save) would re-fire the same sync endlessly.
        if (trimmed === initialUrlRef.current) {
            return
        }
        const debounced = debounce(async () => {
            setUrlAutosaveStatus("saving")
            await runGraphQL(
                async () => {
                    try {
                        const result = await syncGithubTrigger({ courseId: course.id, githubUrl: trimmed })
                        const payload = result?.data?.syncPersonalProjectGithub
                        if (!payload) {
                            throw new Error("Sync failed")
                        }
                        if (!payload.success) {
                            setGithubUrlError(payload.error ?? payload.message ?? t("finalProject.page.submitGithub.syncFailed"))
                            setUrlAutosaveStatus("failed")
                            return payload
                        }
                        // record the synced value so the guard above stops re-firing
                        initialUrlRef.current = trimmed
                        await mutateEnrollmentStatus()
                        setUrlAutosaveStatus("saved")
                        return payload
                    } catch (error) {
                        setUrlAutosaveStatus("failed")
                        throw error
                    }
                },
                { showSuccessToast: false },
            )
        }, 600)
        debounced()
        return () => debounced.cancel()
    }, [enableSync, course?.id, githubUrl, validationError.githubUrl, sidebarTab, t, syncGithubTrigger, mutateEnrollmentStatus, setGithubUrlError, runGraphQL])

    // Debounced branch sync.
    useEffect(() => {
        if (!enableSync || sidebarTab !== SidebarTab.PersonalProject || !course?.id) {
            return
        }
        if (validationError.branch) {
            return
        }
        const trimmed = branch.trim()
        if (trimmed === initialBranchRef.current) {
            return
        }
        const debounced = debounce(async () => {
            setBranchAutosaveStatus("saving")
            await runGraphQL(
                async () => {
                    try {
                        const result = await syncBranchTrigger({ courseId: course.id, branch: trimmed.length > 0 ? trimmed : "" })
                        const payload = result?.data?.syncPersonalProjectGithub
                        if (!payload) {
                            throw new Error("Sync failed")
                        }
                        if (!payload.success) {
                            setBranchError(payload.error ?? payload.message ?? t("finalProject.page.submitGithub.syncFailed"))
                            setBranchAutosaveStatus("failed")
                            return payload
                        }
                        // record the synced value so the guard above stops re-firing
                        initialBranchRef.current = trimmed
                        await mutateEnrollmentStatus()
                        setBranchAutosaveStatus("saved")
                        return payload
                    } catch (error) {
                        setBranchAutosaveStatus("failed")
                        throw error
                    }
                },
                { showSuccessToast: false },
            )
        }, 600)
        debounced()
        return () => debounced.cancel()
    }, [enableSync, course?.id, branch, validationError.branch, sidebarTab, t, syncBranchTrigger, mutateEnrollmentStatus, setBranchError, runGraphQL])

    // Private-repo GitHub token: a one-off save/clear (NOT autosaved per keystroke — it's a secret).
    // Write-only — the plaintext is encrypted server-side and never returned.
    const [tokenSaveStatus, setTokenSaveStatus] = useState<PersonalProjectGithubAutosaveStatus>("idle")

    const saveGithubToken = useCallback(async (token: string) => {
        const trimmed = token.trim()
        if (!course?.id || !trimmed) {
            return
        }
        setTokenSaveStatus("saving")
        await runGraphQL(
            async () => {
                try {
                    const result = await syncPersonalProjectGithubSwr.trigger({ courseId: course.id, githubToken: trimmed })
                    const payload = result?.data?.syncPersonalProjectGithub
                    if (!payload?.success) {
                        setTokenSaveStatus("failed")
                        throw new Error(payload?.error ?? payload?.message ?? t("finalProject.page.submitGithub.syncFailed"))
                    }
                    await queryCourseEnrollmentStatusSwr.mutate()
                    setTokenSaveStatus("saved")
                    return payload
                } catch (error) {
                    setTokenSaveStatus("failed")
                    throw error
                }
            },
            { showSuccessToast: true },
        )
    }, [course?.id, syncPersonalProjectGithubSwr, queryCourseEnrollmentStatusSwr, t, runGraphQL])

    const clearGithubToken = useCallback(async () => {
        if (!course?.id) {
            return
        }
        setTokenSaveStatus("saving")
        await runGraphQL(
            async () => {
                try {
                    const result = await syncPersonalProjectGithubSwr.trigger({ courseId: course.id, clearGithubToken: true })
                    const payload = result?.data?.syncPersonalProjectGithub
                    if (!payload?.success) {
                        setTokenSaveStatus("failed")
                        throw new Error(payload?.error ?? payload?.message ?? t("finalProject.page.submitGithub.syncFailed"))
                    }
                    await queryCourseEnrollmentStatusSwr.mutate()
                    setTokenSaveStatus("idle")
                    return payload
                } catch (error) {
                    setTokenSaveStatus("failed")
                    throw error
                }
            },
            { showSuccessToast: true },
        )
    }, [course?.id, syncPersonalProjectGithubSwr, queryCourseEnrollmentStatusSwr, t, runGraphQL])

    const submit = useCallback(async () => {
        if (!course?.id) {
            return
        }
        const draftUrl = githubUrl.trim()
        const enrollmentUrl = enrollment?.personalProjectGithubUrl?.trim() ?? ""
        const resolvedUrl = draftUrl || enrollmentUrl
        if (!resolvedUrl) {
            setBranchError(t("finalProject.page.submitGithub.missingRepoForReview"))
            return
        }
        const branchTrimmed = branch.trim()
        setIsSubmitting(true)
        try {
            await runGraphQL(
                async () => {
                    if (!selectedTaskId) {
                        throw new Error("Selected task ID is required")
                    }
                    // Economy+ only — never the free Auto lane. Use the picked model, falling back
                    // to a seeded Economy default if the catalog hadn't seeded one yet.
                    const resolvedGrade = gradeModel
                        ? gradeSelection
                        : pickDefaultGradingModel(gradeModels, canPremium)
                    const reviewResult = await reviewPersonalProjectTaskSwr.trigger({
                        courseId: course.id,
                        taskId: selectedTaskId,
                        githubUrl: resolvedUrl,
                        branch: branchTrimmed || undefined,
                        lang: lang || undefined,
                        mode: resolvedGrade?.mode,
                        selectedModel: resolvedGrade?.model ?? undefined,
                        selectedModelProvider: resolvedGrade?.provider ?? undefined,
                    })
                    const reviewEnv = reviewResult?.data?.reviewPersonalProjectTask
                    if (!reviewEnv) {
                        throw new Error("Review failed")
                    }
                    if (!reviewEnv.success) {
                        throw new Error(reviewEnv.error ?? reviewEnv.message ?? "Review failed")
                    }
                    const jobId = reviewEnv.data?.jobId
                    if (jobId) {
                        dispatch(addMilestoneTaskIdToJobId({ milestoneTaskId: selectedTaskId, jobId }))
                    }
                    await queryCourseEnrollmentStatusSwr.mutate()
                    return reviewEnv
                },
                { showErrorToast: true, showSuccessToast: true },
            )
        } finally {
            setIsSubmitting(false)
        }
    }, [course?.id, githubUrl, branch, lang, gradeModel, gradeSelection, gradeModels, canPremium, enrollment?.personalProjectGithubUrl, selectedTaskId, reviewPersonalProjectTaskSwr, dispatch, queryCourseEnrollmentStatusSwr, setBranchError, setIsSubmitting, t, runGraphQL])

    return {
        githubUrl,
        branch,
        lang,
        errors,
        touched: { githubUrl: touchedGithubUrl, branch: touchedBranch },
        autosaveStatus: { githubUrl: urlAutosaveStatus, branch: branchAutosaveStatus },
        isSubmitting,
        gradeModels,
        gradeSelection,
        canPremium,
        setGradeSelection,
        setGithubUrl,
        setBranch,
        setLang,
        setTouchedGithubUrl,
        setTouchedBranch,
        setGithubUrlError,
        setBranchError,
        submit,
        saveGithubToken,
        clearGithubToken,
        tokenSaveStatus,
    }
}
