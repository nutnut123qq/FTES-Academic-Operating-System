import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { ChallengeEntity } from "@/modules/types/entities/challenge"
import type { ContentEntity } from "@/modules/types/entities/content"
import type { JobCategory } from "@/modules/types/enums/job-category"

/**
 * Payload carried by the AI processing modal (optional job tracking fields).
 */
export interface AIProcessingModalData {
    /** Optional `jobs.id` for flows that track a single async job. */
    jobId?: string
    /** Optional `jobs.category` for flows that track a single async job. */
    category?: JobCategory
}

/**
 * The data for the content modal.
 */
export interface ContentModalData {
    /** The content. */
    data: ContentEntity
}

/**
 * The data for the challenge modal.
 */
export interface ChallengeModalData {
    /** The challenge. */
    data: ChallengeEntity
}

/**
 * Modal-related UI state (content reader, challenge detail, etc.).
 */
export interface ModalSlice {
    /** Payload for the content reader modal. */
    data?: ContentModalData
    /** Payload for the challenge detail modal. */
    challengeData?: ChallengeModalData
    /** Payload for the AI processing modal. */
    aiProcessingData?: AIProcessingModalData
}

/** Initial state for the modal slice. */
const initialState: ModalSlice = {
    data: undefined,
    challengeData: undefined,
    aiProcessingData: undefined,
}

/**
 * Slice managing which modal is open and what data it should display.
 */
export const modalSlice = createSlice({
    name: "modal",
    initialState,
    reducers: {
        /** Set the content entity to display in the content reader modal. */
        setContentModalData: (
            state,
            action: PayloadAction<ContentModalData>
        ) => {
            state.data = action.payload
        },
        /** Set the challenge entity to display in the challenge detail modal. */
        setChallengeModalData: (
            state,
            action: PayloadAction<ChallengeModalData>
        ) => {
            state.challengeData = action.payload
        },
        /** Set the AI processing context (job id / category) for the AI modal. */
        setAiProcessingModalData: (
            state,
            action: PayloadAction<AIProcessingModalData>
        ) => {
            state.aiProcessingData = action.payload
        },
    },
})

/** Root reducer for the modal slice. */
export const modalReducer = modalSlice.reducer

/** Actions exported from the modal slice. */
export const {
    setContentModalData,
    setChallengeModalData,
    setAiProcessingModalData,
} = modalSlice.actions
