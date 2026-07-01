/**
 * CV Upload Related Types
 */

/** Request body for obtaining a presigned S3 upload URL. */
export interface CVPresignedUrlRequest {
    /** Original file name (used to derive S3 key and content-type hints). */
    fileName: string
    /** MIME type of the file (e.g. `application/pdf`). */
    fileType: string
}

/** Response from the presigned URL endpoint. */
export interface CVPresignedUrlResponse {
    /** Presigned S3 URL to PUT the file to. */
    url: string
    /** S3 object key assigned to the uploaded file. */
    key: string
}

/** Request body to trigger AI processing of an uploaded CV. */
export interface ProcessCVRequest {
    /** S3 object key of the uploaded CV file. */
    s3Key: string
    /** Original file name for display purposes. */
    fileName: string
}

/** Response after triggering CV processing. */
export interface ProcessCVResponse {
    /** BullMQ / backend job id for polling status. */
    jobId: string
    /** Initial job status string. */
    status: string
}

/** Mirrors `CvUrlViewData` from the `cvUrl` GraphQL query. */
export interface CvUrlPayload {
    /** Entity id of the CV record. */
    id: string
    /** Current review status string. */
    status: string
    /** Presigned URL to download or display the CV. */
    cvUrl: string
    /** Seconds until {@link CvUrlPayload.cvUrl} expires. */
    cvUrlExpiresInSeconds: number
    /** Full AI review (markdown) on latest attempt after analyze. */
    detailFeedback?: string | null
    /** Holistic score 0–100 on latest attempt when analyze returned `score`. */
    score?: number | null
    /** ISO timestamp from API (latest attempt or submission created time). */
    submittedAt?: string | null
}

/** In-memory tracking record for an in-progress or finished CV upload job. */
export interface CVUploadJob {
    /** Job id returned by the backend. */
    jobId: string
    /** Current lifecycle status. */
    status: "processing" | "completed" | "failed" | "pending"
    /** Original file name. */
    fileName: string
    /** S3 object key of the uploaded file. */
    s3Key: string
    /** When the upload was initiated. */
    uploadedAt: Date
    /** When the job finished (success or failure). */
    completedAt?: Date
    /** Error message if the job failed. */
    error?: string
}

/** Structured CV data extracted by the AI parser. */
export interface CVData {
    /** Associated job id. */
    jobId: string
    /** Candidate's full name. */
    fullName?: string
    /** Candidate's email address. */
    email?: string
    /** Candidate's phone number. */
    phone?: string
    /** Professional summary or objective statement. */
    summary?: string
    /** Work experience entries. */
    experience?: Array<CVExperience>
    /** Education history entries. */
    education?: Array<CVEducation>
    /** Technical and soft skills. */
    skills?: Array<string>
    /** Professional certifications. */
    certifications?: Array<CVCertification>
}

/** A single work experience entry within a CV. */
export interface CVExperience {
    /** Employer company name. */
    company: string
    /** Job title or role held. */
    position: string
    /** Employment start date (ISO or formatted string). */
    startDate: string
    /** Employment end date; absent when {@link CVExperience.isCurrently} is true. */
    endDate?: string
    /** Role description or responsibilities. */
    description?: string
    /** Whether the candidate is currently employed here. */
    isCurrently?: boolean
}

/** A single education entry within a CV. */
export interface CVEducation {
    /** Name of the academic institution. */
    institution: string
    /** Degree level (e.g. Bachelor's, Master's). */
    degree: string
    /** Field of study or major. */
    field: string
    /** Graduation date (ISO or formatted string). */
    graduationDate?: string
    /** Grade point average. */
    gpa?: number
}

/** A single professional certification within a CV. */
export interface CVCertification {
    /** Certification name. */
    name: string
    /** Issuing organization. */
    issuer: string
    /** Date the certification was issued. */
    issueDate?: string
    /** Expiry date of the certification, if applicable. */
    expiryDate?: string
    /** Unique credential or verification id. */
    credentialId?: string
}
