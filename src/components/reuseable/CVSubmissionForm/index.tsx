"use client"

import React from "react"
import {
    Card,
    cn,
} from "@heroui/react"
import {
    Formik,
} from "formik"
import type {
    FormikHelpers,
} from "formik"
import type {
    CvSubmissionFormValues,
} from "@/types"
import {
    CV_SUBMISSION_VALIDATION_SCHEMA,
} from "./constants"
import {
    CvSubmissionFields,
} from "./CvSubmissionFields"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link CVSubmissionForm}. */
export interface CVSubmissionFormProps extends WithClassNames<undefined> {
    /** Whether the S3 upload step is in progress. */
    isUploading: boolean
    /** Whether the backend processing step is in progress. */
    isProcessing: boolean
    /** Upload progress percentage (0–100). */
    uploadProgress: number
    /** Name of the successfully uploaded file, or `null`. */
    uploadedFileName: string | null
    /** S3 key of the successfully uploaded file, or `null`. */
    uploadedS3Key: string | null
    /** Fired with the form values to upload the CV; the parent container owns the async upload logic. */
    onSubmit: (
        values: CvSubmissionFormValues,
        helpers: FormikHelpers<CvSubmissionFormValues>,
    ) => void | Promise<void>
    /** Fired to trigger backend processing of the uploaded CV. */
    onProcess: () => void
}

/**
 * Presentational CV submission form: Formik wrapper + file fields + progress bar.
 *
 * Presentational (reuseable): owns only form/UI wiring and local validation; the
 * parent container supplies the upload/process handlers and progress state via
 * props. `"use client"` — uses Formik and interactive controls.
 * @param props - {@link CVSubmissionFormProps}
 */
export const CVSubmissionForm = ({
    isUploading,
    isProcessing,
    uploadProgress,
    uploadedFileName,
    uploadedS3Key,
    onSubmit,
    onProcess,
    className,
}: CVSubmissionFormProps) => {
    return (
        <Card className={cn("p-6", className)}>
            <Formik
                initialValues={{ cv: null as File | null }}
                validationSchema={CV_SUBMISSION_VALIDATION_SCHEMA}
                onSubmit={onSubmit}
            >
                {({ errors, touched, setFieldValue, values, isSubmitting }) => (
                    <CvSubmissionFields
                        values={values}
                        errors={errors}
                        touched={touched}
                        isSubmitting={isSubmitting}
                        setFieldValue={setFieldValue}
                        isUploading={isUploading}
                        isProcessing={isProcessing}
                        uploadProgress={uploadProgress}
                        uploadedFileName={uploadedFileName}
                        uploadedS3Key={uploadedS3Key}
                        onProcess={onProcess}
                    />
                )}
            </Formik>
        </Card>
    )
}
