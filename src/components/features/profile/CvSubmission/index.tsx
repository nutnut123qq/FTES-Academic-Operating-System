"use client"

import React, {
    useCallback,
    useState,
} from "react"
import type {
    FormikHelpers,
} from "formik"
import {
    cn,
} from "@heroui/react"
import type {
    CvSubmissionFormValues,
} from "@/types"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { mutateGetCVPresignedUrl } from "@/modules/api/graphql/mutations/mutation-get-cv-presigned-url"
import { mutateProcessCV } from "@/modules/api/graphql/mutations/mutation-process-cv"
import { useAppSelector } from "@/redux/hooks"
import { CVSubmissionForm } from "@/components/reuseable/CVSubmissionForm"
import { useRestWithToast } from "@/modules/toast/hooks"

/** Fraction of progress shown after each upload step (UI feedback only). */
const UPLOAD_PROGRESS = {
    /** Presigned-URL request issued. */
    presign: 20,
    /** S3 PUT in flight. */
    uploading: 40,
    /** Upload finished. */
    done: 100,
} as const

/** Props for {@link CvSubmission}. */
export type CvSubmissionProps = WithClassNames<undefined>

/**
 * CV submission container.
 *
 * Owns the business logic — auth token (redux), upload/process state, the
 * presigned-URL + S3 upload + process mutations — and renders the presentational
 * {@link CVSubmissionForm}. `"use client"` because it holds state + side effects.
 * @param props - {@link CvSubmissionProps}
 */
export const CvSubmission = ({
    className,
}: CvSubmissionProps) => {
    /** Keycloak access token used to authorize the API calls. */
    const token = useAppSelector((state) => state.keycloak.accessToken)
    /** Whether the S3 upload step is in progress. */
    const [isUploading, setIsUploading] = useState(false)
    /** Whether the backend processing step is in progress. */
    const [isProcessing, setIsProcessing] = useState(false)
    /** Upload progress percentage (0–100). */
    const [uploadProgress, setUploadProgress] = useState(0)
    /** Name of the successfully uploaded file, or `null`. */
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
    /** S3 key of the successfully uploaded file, or `null`. */
    const [uploadedS3Key, setUploadedS3Key] = useState<string | null>(null)
    /** Localized toast wrapper for REST calls. */
    const runRest = useRestWithToast()

    /** Upload the selected CV to S3 via a presigned URL. */
    const onSubmit = useCallback(
        async (
            values: CvSubmissionFormValues,
            { resetForm }: FormikHelpers<CvSubmissionFormValues>,
        ) => {
            if (!token) {
                console.error("Authentication token not found")
                return
            }
            if (!values.cv) {
                console.error("CV file is required")
                return
            }

            try {
                setIsUploading(true)
                setUploadProgress(0)
                setUploadedFileName(null)
                setUploadedS3Key(null)

                // Step 1: get a presigned URL from the backend
                setUploadProgress(UPLOAD_PROGRESS.presign)
                const presignedUrlResponse = await mutateGetCVPresignedUrl({
                    request: {
                        fileName: values.cv.name,
                        fileType: values.cv.type,
                    },
                    token,
                })
                if (!presignedUrlResponse.data?.getCVPresignedUrl?.data) {
                    throw new Error(
                        presignedUrlResponse.data?.getCVPresignedUrl?.message
                            || "Failed to get presigned URL",
                    )
                }
                const {
                    url: presignedUrl,
                    key: s3Key,
                } = presignedUrlResponse.data.getCVPresignedUrl.data

                // Step 2: upload the file to S3 via PUT
                setUploadProgress(UPLOAD_PROGRESS.uploading)
                const cvFile = values.cv
                const uploadResponse = await runRest(
                    async () => {
                        const response = await fetch(presignedUrl, {
                            method: "PUT",
                            body: cvFile,
                            headers: {
                                "Content-Type": cvFile.type,
                            },
                        })
                        if (!response.ok) {
                            throw new Error(
                                `Failed to upload file to S3: ${response.statusText}`,
                            )
                        }
                        return response
                    },
                    {
                        showSuccessToast: false,
                    },
                )
                if (!uploadResponse) {
                    return
                }

                setUploadProgress(UPLOAD_PROGRESS.done)
                setUploadedFileName(values.cv.name)
                setUploadedS3Key(s3Key)
                resetForm()
            } catch (error) {
                console.error("CV upload error:", error)
            } finally {
                setIsUploading(false)
            }
        },
        [
            token,
            runRest,
        ],
    )

    /** Trigger backend processing of the previously uploaded CV. */
    const onProcess = useCallback(
        async () => {
            if (!token) {
                console.error("Authentication token not found")
                return
            }
            if (!uploadedS3Key || !uploadedFileName) {
                console.error("Please upload CV first")
                return
            }

            try {
                setIsProcessing(true)
                const processResponse = await mutateProcessCV({
                    request: {
                        s3Key: uploadedS3Key,
                        fileName: uploadedFileName,
                    },
                    token,
                })
                if (!processResponse.data?.processCV?.data) {
                    throw new Error(
                        processResponse.data?.processCV?.message
                            || "Failed to process CV",
                    )
                }
            } catch (error) {
                console.error("CV process error:", error)
            } finally {
                setIsProcessing(false)
            }
        },
        [
            token,
            uploadedS3Key,
            uploadedFileName,
        ],
    )

    return (
        <div className={cn(className)}>
            <CVSubmissionForm
                isUploading={isUploading}
                isProcessing={isProcessing}
                uploadProgress={uploadProgress}
                uploadedFileName={uploadedFileName}
                uploadedS3Key={uploadedS3Key}
                onSubmit={onSubmit}
                onProcess={onProcess}
            />
        </div>
    )
}
