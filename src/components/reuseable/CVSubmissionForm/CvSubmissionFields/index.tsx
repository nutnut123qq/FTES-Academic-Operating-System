"use client"

import React, {
    useCallback,
    useId,
} from "react"
import {
    Button,
    ProgressBar,
    Spinner,
    cn,
} from "@heroui/react"
import {
    Form,
} from "formik"
import type {
    FormikErrors,
    FormikTouched,
} from "formik"
import type {
    CvSubmissionFormValues,
} from "@/types"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link CvSubmissionFields}. */
export interface CvSubmissionFieldsProps extends WithClassNames<undefined> {
    /** Current form values from Formik. */
    values: CvSubmissionFormValues
    /** Validation errors from Formik. */
    errors: FormikErrors<CvSubmissionFormValues>
    /** Touched-field map from Formik. */
    touched: FormikTouched<CvSubmissionFormValues>
    /** Whether the wrapped Formik form is currently submitting. */
    isSubmitting: boolean
    /** Sets the `cv` field value on the Formik form. */
    setFieldValue: (field: string, value: File) => void
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
    /** Fired to trigger backend processing of the uploaded CV. */
    onProcess: () => void
}

/**
 * Inner field layout for the CV submission form: file dropzone, progress bar,
 * and the upload/process buttons.
 *
 * Presentational: renders the supplied Formik render-prop values + upload state,
 * no business logic.
 * @param props - {@link CvSubmissionFieldsProps}
 */
export const CvSubmissionFields = ({
    values,
    errors,
    touched,
    isSubmitting,
    setFieldValue,
    isUploading,
    isProcessing,
    uploadProgress,
    uploadedFileName,
    uploadedS3Key,
    onProcess,
    className,
}: CvSubmissionFieldsProps) => {
    /** Stable id linking the hidden file input to its label. */
    const inputId = useId()

    /** Push the chosen file into the Formik `cv` field. */
    const onFileChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.currentTarget.files?.[0]
            if (file) {
                setFieldValue("cv", file)
            }
        },
        [
            setFieldValue,
        ],
    )

    return (
        <Form className={cn("space-y-3", className)}>
            <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                    Upload CV (PDF)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={onFileChange}
                        disabled={isUploading || isProcessing}
                        className="hidden"
                        id={inputId}
                    />
                    <label
                        htmlFor={inputId}
                        className="cursor-pointer block"
                    >
                        <div className="text-gray-600">
                            {values.cv ? (
                                <div>
                                    <p className="font-semibold text-blue-600">
                                        {(values.cv as File).name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {(
                                            (values.cv as File).size /
                                            1024
                                        ).toFixed(2)}{" "}
                                        KB
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p>
                                        Drag and drop your CV or
                                        click to select
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        PDF files only, max 10MB
                                    </p>
                                </div>
                            )}
                        </div>
                    </label>
                </div>
                {errors.cv && touched.cv && (
                    <p className="text-sm text-red-500">
                        {errors.cv as string}
                    </p>
                )}

                {uploadedFileName && uploadedS3Key && (
                    <p className="text-sm text-emerald-600">
                        Upload successful. Click Process CV to trigger backend processing.
                    </p>
                )}
            </div>

            {isUploading && (
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                            Uploading...
                        </span>
                        <span className="text-sm text-gray-500">
                            {uploadProgress}%
                        </span>
                    </div>
                    <ProgressBar
                        className="w-full"
                        maxValue={100}
                        minValue={0}
                        value={uploadProgress}
                    >
                        <ProgressBar.Track>
                            <ProgressBar.Fill />
                        </ProgressBar.Track>
                    </ProgressBar>
                </div>
            )}

            <Button
                type="submit"
                isDisabled={isUploading || isProcessing || isSubmitting}
                className="w-full"
                variant="primary"
            >
                {isUploading ? (
                    <>
                        <Spinner size="sm" />
                        Uploading to S3...
                    </>
                ) : (
                    "Upload CV"
                )}
            </Button>

            <Button
                type="button"
                isDisabled={
                    !uploadedFileName ||
                    !uploadedS3Key ||
                    isUploading ||
                    isProcessing
                }
                className="w-full"
                variant="secondary"
                onPress={onProcess}
            >
                {isProcessing ? (
                    <>
                        <Spinner size="sm" />
                        Processing CV...
                    </>
                ) : (
                    "Process CV"
                )}
            </Button>
        </Form>
    )
}
