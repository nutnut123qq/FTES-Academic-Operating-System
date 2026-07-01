"use client"

import { useCallback, useMemo, useState } from "react"
import { z } from "zod"
import axios from "axios"
import { useCvApplyStore } from "./store"
import { sleep } from "@/modules/utils/misc"
import { useGraphQLWithToast, useRestWithToast } from "@/modules/toast/hooks"
import { useMutateGenerateSubmitCvPresignUrlSwr } from "@/hooks/swr/api/graphql/mutations/useMutateGenerateSubmitCvPresignUrlSwr"
import { useMutateVerifySubmitCvPresignUrlSwr } from "@/hooks/swr/api/graphql/mutations/useMutateVerifySubmitCvPresignUrlSwr"

/** CV file validation schema: required, must be PDF, ≤ 10MB. */
const cvFileSchema = z.custom<File | null>((value) => value instanceof File, "cv.form.errors.fileRequired")
    .refine((file) => file instanceof File && file.type === "application/pdf", "cv.form.errors.fileTypeInvalid")
    .refine((file) => file instanceof File && file.size <= 10 * 1024 * 1024, "cv.form.errors.fileSizeInvalid")

/**
 * Form hook for CV apply — file state SHARED via {@link useCvApplyStore} (page and modal see it).
 * Not react-hook-form because this is a single field shared across the tree (shared state → store).
 * Validated with zod; submit runs the presign → PUT upload → wait for MinIO → verify flow.
 * @returns `cvFile`, `setCvFile`, `error` (i18n key or null), `submit`, `isSubmitting`.
 */
export const useCvApplyForm = () => {
    const cvFile = useCvApplyStore((state) => state.cvFile)
    const setCvFile = useCvApplyStore((state) => state.setCvFile)
    const { trigger: triggerGenerateSubmitCvPresignUrl } = useMutateGenerateSubmitCvPresignUrlSwr()
    const { trigger: triggerVerifySubmitCvPresignUrl } = useMutateVerifySubmitCvPresignUrlSwr()
    const runGraphQL = useGraphQLWithToast()
    const runRest = useRestWithToast()
    const [isSubmitting, setIsSubmitting] = useState(false)

    /** i18n key of the current validation error; null when valid. */
    const error = useMemo(() => {
        const result = cvFileSchema.safeParse(cvFile)
        return result.success ? null : (result.error.issues[0]?.message ?? "cv.form.errors.fileRequired")
    }, [cvFile])

    const submit = useCallback(async () => {
        if (!cvFile || error) {
            return
        }
        setIsSubmitting(true)
        try {
            await runGraphQL(
                async () => {
                    const generateResponse = await triggerGenerateSubmitCvPresignUrl({
                        request: { fileName: cvFile.name },
                    })
                    const generatePayload = generateResponse.data?.generateSubmitCvPresignUrl?.data
                    if (!generatePayload?.url) {
                        throw new Error("Failed to get pre-signed URL")
                    }
                    const contentType = cvFile.type || "application/pdf"
                    const uploadResponse = await runRest(
                        () => axios.put(generatePayload.url, cvFile, {
                            headers: { "Content-Type": contentType },
                        }),
                        { showSuccessToast: false },
                    )
                    if (!uploadResponse || uploadResponse.status !== 200) {
                        throw new Error(`Upload failed with status ${uploadResponse?.status}`)
                    }
                    // Wait 1s for MinIO to propagate before verifying.
                    await sleep(1000)
                    const verifyResponse = await triggerVerifySubmitCvPresignUrl({
                        request: { cvSubmissionId: generatePayload.cvSubmissionId },
                        signal: new AbortController().signal,
                    })
                    if (!verifyResponse.data?.verifySubmitCvPresignUrl) {
                        throw new Error("CV file was not found in storage. Please try again.")
                    }
                    return verifyResponse.data.verifySubmitCvPresignUrl
                },
                { showErrorToast: true, showSuccessToast: true },
            )
        } finally {
            setIsSubmitting(false)
        }
    }, [cvFile, error, triggerGenerateSubmitCvPresignUrl, triggerVerifySubmitCvPresignUrl, runGraphQL, runRest])

    return { cvFile, setCvFile, error, submit, isSubmitting }
}
