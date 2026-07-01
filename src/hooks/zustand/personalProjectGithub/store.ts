"use client"

import { create } from "zustand"
import { AiMode, type ModelProvider } from "@/modules/api/graphql/queries/query-my-ai-settings"

/** Inline autosave status for the debounced url/branch sync. */
export type PersonalProjectGithubAutosaveStatus = "idle" | "saving" | "saved" | "failed"

/**
 * Grading-lane + concrete-model pick for the personal-project review. Unlike the challenge
 * picker there is NO free Auto lane: the personal project must always grade with an Economy
 * tier model or higher, so `model`/`provider` are seeded (never left null at submit).
 */
export interface GradingModelSelection {
    /** AI lane the chosen model runs on (auto for economy without a plan, premium otherwise). */
    mode: AiMode
    /** Concrete model name; null only before the catalog has seeded a default. */
    model: string | null
    /** Provider serving {@link model}. */
    provider: ModelProvider | null
}

/**
 * Zustand store for the personal-project GitHub form — SHARED between PersonalProjectSubmission
 * (enters url/branch, shows errors) and Task (reads isSubmitting, triggers submit). Previously a
 * formik singleton. The url/branch autosave status lives here too so the field (which may render in
 * the settings Drawer) and the sync OWNER (the panel) stay in sync across component boundaries.
 */
interface PersonalProjectGithubStoreState {
    /** GitHub repo URL. */
    githubUrl: string
    /** Git branch. */
    branch: string
    /** Chosen programming language to grade against (typescript/java/csharp/go). */
    lang: string
    /** AI lane for grading (auto for economy without a plan, premium otherwise). */
    gradeMode: AiMode
    /** Chosen grading model name; null until the catalog seeds a default. */
    gradeModel: string | null
    /** Provider for {@link PersonalProjectGithubStoreState.gradeModel}. */
    gradeModelProvider: ModelProvider | null
    /** Whether githubUrl has been blurred/touched. */
    touchedGithubUrl: boolean
    /** Whether branch has been blurred/touched. */
    touchedBranch: boolean
    /** Manually-set error for githubUrl (from sync/submit); null when none. */
    githubUrlError: string | null
    /** Manually-set error for branch. */
    branchError: string | null
    /** Whether a submit (AI review) is in flight. */
    isSubmitting: boolean
    /** Whether the form has been seeded from enrollment yet (seed-once). */
    seeded: boolean
    /** Autosave status of the debounced URL sync (set by the enableSync owner). */
    urlAutosaveStatus: PersonalProjectGithubAutosaveStatus
    /** Autosave status of the debounced branch sync. */
    branchAutosaveStatus: PersonalProjectGithubAutosaveStatus
    setUrlAutosaveStatus: (value: PersonalProjectGithubAutosaveStatus) => void
    setBranchAutosaveStatus: (value: PersonalProjectGithubAutosaveStatus) => void
    setGithubUrl: (value: string) => void
    setBranch: (value: string) => void
    setLang: (value: string) => void
    /** Set the grading-lane + model pick together. */
    setGradeSelection: (value: GradingModelSelection) => void
    setTouchedGithubUrl: (value: boolean) => void
    setTouchedBranch: (value: boolean) => void
    setGithubUrlError: (value: string | null) => void
    setBranchError: (value: string | null) => void
    setIsSubmitting: (value: boolean) => void
    /** Seed githubUrl + branch once from enrollment. */
    seed: (githubUrl: string, branch: string) => void
}

/** Shared store for the personal-project GitHub form. */
export const usePersonalProjectGithubStore = create<PersonalProjectGithubStoreState>((set) => ({
    githubUrl: "",
    branch: "main",
    lang: "typescript",
    gradeMode: AiMode.Auto,
    gradeModel: null,
    gradeModelProvider: null,
    touchedGithubUrl: false,
    touchedBranch: false,
    githubUrlError: null,
    branchError: null,
    isSubmitting: false,
    seeded: false,
    urlAutosaveStatus: "idle",
    branchAutosaveStatus: "idle",
    setUrlAutosaveStatus: (urlAutosaveStatus) => set({ urlAutosaveStatus }),
    setBranchAutosaveStatus: (branchAutosaveStatus) => set({ branchAutosaveStatus }),
    setGithubUrl: (githubUrl) => set({ githubUrl, githubUrlError: null }),
    setBranch: (branch) => set({ branch, branchError: null }),
    setLang: (lang) => set({ lang }),
    setGradeSelection: ({ mode, model, provider }) => set({
        gradeMode: mode,
        gradeModel: model,
        gradeModelProvider: provider,
    }),
    setTouchedGithubUrl: (touchedGithubUrl) => set({ touchedGithubUrl }),
    setTouchedBranch: (touchedBranch) => set({ touchedBranch }),
    setGithubUrlError: (githubUrlError) => set({ githubUrlError }),
    setBranchError: (branchError) => set({ branchError }),
    setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
    seed: (githubUrl, branch) => set({ githubUrl, branch, seeded: true }),
}))
