import * as Yup from "yup"

/** Maximum allowed CV file size in bytes (10MB). */
export const MAX_CV_FILE_SIZE_BYTES = 10 * 1024 * 1024

/** Yup validation schema for the CV submission form (PDF, max 10MB). */
export const CV_SUBMISSION_VALIDATION_SCHEMA = Yup.object().shape({
    cv: Yup.mixed()
        .required("CV file is required")
        .test("fileType", "Only PDF files are allowed", (value) => {
            if (!value) return false
            const file = value as File
            return file.type === "application/pdf"
        })
        .test("fileSize", "File size must be less than 10MB", (value) => {
            if (!value) return false
            const file = value as File
            return file.size <= MAX_CV_FILE_SIZE_BYTES
        }),
})
