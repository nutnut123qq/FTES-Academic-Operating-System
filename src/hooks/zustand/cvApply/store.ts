"use client"

import { create } from "zustand"

/**
 * Zustand store for the currently selected CV file — SHARED between the upload modal (which sets
 * it) and the CVUpload/CVPreview page (which reads it for the preview). This was previously shared
 * through the formik singleton; it is now an external store so page and modal see the same file.
 */
interface CvApplyStoreState {
    /** CV file the user just picked (not yet uploaded); null when none selected. */
    cvFile: File | null
    /** Set or clear the CV file. */
    setCvFile: (file: File | null) => void
}

/** Shared store for the CV file. */
export const useCvApplyStore = create<CvApplyStoreState>((set) => ({
    cvFile: null,
    setCvFile: (file) => set({ cvFile: file }),
}))
