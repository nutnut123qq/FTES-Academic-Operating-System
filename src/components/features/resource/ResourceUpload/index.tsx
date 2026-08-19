"use client"

import React, { useCallback, useMemo, useState } from "react"
import {
    Button,
    Input,
    Label,
    TextArea,
    TextField,
    Typography,
    toast,
} from "@heroui/react"
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { useRouter } from "@/i18n/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useQuerySubjectOptionsSwr } from "@/components/features/subject/hooks/useQuerySubjectsSwr"

import { ResourceDropzone } from "./ResourceDropzone"
import { ResourceUploadProgress } from "./ResourceUploadProgress"
import { useResourceUploadFlow } from "./useResourceUploadFlow"
import type { ResourceUploadStep } from "./uploadFlow"
import {
    RESOURCE_TYPE_CODES,
    RESOURCE_TYPE_RULES,
    resourceAcceptAttribute,
    validateResourceFile,
    type ResourceFileRejection,
    type ResourceTypeCode,
} from "./uploadRules"

/** BE `Visibility` enum values offered in the form (BE default: `MEMBERS`). */
const VISIBILITIES = ["MEMBERS", "PUBLIC", "PRIVATE"] as const

/** BE `License` enum values offered in the form (BE default: `ALL_RIGHTS_RESERVED`). */
const LICENSES = [
    "ALL_RIGHTS_RESERVED",
    "CC_BY",
    "CC_BY_SA",
    "CC_BY_NC",
    "MIT",
    "APACHE_2",
    "PUBLIC_DOMAIN",
] as const

/** Shared class of the native selects (the form has no HeroUI Select on canon yet). */
const SELECT_CLASS =
    "w-full rounded-large border border-separator bg-default/40 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"

/**
 * Resource upload form (§5) wired to the REAL publish chain:
 * `POST /resources` → `POST /{id}/versions/upload-url` → `PUT presignedPutUrl` →
 * `POST /versions/{versionId}/complete` → `POST /{id}/submit` (moderation).
 *
 * The file is gated client-side against the BE `ResourceType` MIME/size whitelist
 * (see `uploadRules.ts`) so a doomed upload never starts, the chain runs as a
 * resumable state machine (`uploadFlow.ts`) so a failure retries from the failed
 * step, and the whole form locks while it runs.
 */
export const ResourceUpload = () => {
    const t = useTranslations("resourceHub")
    const router = useRouter()
    const { guard } = useRequireAuth()
    const { subjects, isLoading: isLoadingSubjects, error: subjectsError } = useQuerySubjectOptionsSwr()
    const flow = useResourceUploadFlow()

    const [file, setFile] = useState<File | null>(null)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [type, setType] = useState<ResourceTypeCode>("PDF")
    const [subjectId, setSubjectId] = useState("")
    const [visibility, setVisibility] = useState<(typeof VISIBILITIES)[number]>("MEMBERS")
    const [license, setLicense] = useState<(typeof LICENSES)[number]>("ALL_RIGHTS_RESERVED")

    const rule = RESOURCE_TYPE_RULES[type]
    const isRunning = flow.isRunning
    const isDone = flow.result !== null
    const isLocked = isRunning || isDone

    /**
     * Validation of the picked file against the CURRENT type. DERIVED (not state) so
     * switching the type re-gates the already-picked file — the whitelist is per-type,
     * a file that is fine for `PDF` is not for `VIDEO`.
     */
    const validation = useMemo(
        () => (file ? validateResourceFile(file, type) : null),
        [file, type],
    )

    const fileError: ResourceFileRejection | null =
        validation && !validation.ok ? validation.reason : null

    const canSubmit =
        !isLocked &&
        file !== null &&
        validation?.ok === true &&
        title.trim() !== "" &&
        subjectId !== ""

    const startUpload = useCallback(async () => {
        if (!file || validation === null || !validation.ok) {
            return
        }
        const outcome = await flow.run({
            file,
            title,
            description,
            type,
            subjectId,
            visibility,
            license,
            mimeType: validation.mimeType,
        })
        if (outcome) {
            toast.success(t("upload.success.toast"))
        }
    }, [file, validation, flow, title, description, type, subjectId, visibility, license, t])

    const onSubmit = guard(() => {
        void startUpload()
    }, "auth.context.uploadResource")

    const onRetry = useCallback(() => {
        void flow.retry()
    }, [flow])

    const onUploadAnother = useCallback(() => {
        flow.reset()
        setFile(null)
        setTitle("")
        setDescription("")
    }, [flow])

    const stepLabel = useCallback(
        (step: ResourceUploadStep) => t(`upload.steps.${step}`),
        [t],
    )

    const resourceId = flow.result?.resource.id ?? null

    return (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {t("upload.title")}
            </Typography>

            {isDone && resourceId ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-separator bg-default/40 p-5">
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon aria-hidden focusable="false" className="size-6 text-success" />
                        <Typography type="h6" weight="bold">
                            {t("upload.success.title")}
                        </Typography>
                    </div>
                    <Typography type="body-sm" color="muted">
                        {t("upload.success.pendingReview")}
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="primary"
                            size="sm"
                            onPress={() => router.push(`/resources/${resourceId}`)}
                        >
                            {t("upload.success.viewResource")}
                        </Button>
                        <Button variant="tertiary" size="sm" onPress={onUploadAnother}>
                            {t("upload.success.uploadAnother")}
                        </Button>
                    </div>
                </div>
            ) : null}

            {!isDone ? (
                <>
                    <ResourceDropzone
                        file={file}
                        onSelect={setFile}
                        accept={resourceAcceptAttribute(type)}
                        label={t("upload.dropzone")}
                        hint={t("upload.dropzoneHint", {
                            extensions: rule.extensions.join(", "),
                            maxSize: rule.maxSizeMb,
                        })}
                        clearLabel={t("upload.clearFile")}
                        isDisabled={isLocked}
                        error={
                            fileError
                                ? t(`upload.fileError.${fileError}`, {
                                      extensions: rule.extensions.join(", "),
                                      maxSize: rule.maxSizeMb,
                                  })
                                : null
                        }
                    />

                    <div className="flex flex-col gap-4">
                        {/* `isDisabled` belongs on the react-aria TextField root — the
                            Input/TextArea inherit it through context. */}
                        <TextField variant="primary" className="w-full" isDisabled={isLocked}>
                            <Label htmlFor="resource-upload-title" className="text-sm">
                                {t("upload.titleLabel")}
                            </Label>
                            <Input
                                id="resource-upload-title"
                                variant="primary"
                                placeholder={t("upload.titleField")}
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                            />
                        </TextField>

                        <TextField variant="primary" className="w-full" isDisabled={isLocked}>
                            <Label htmlFor="resource-upload-description" className="text-sm">
                                {t("upload.descriptionLabel")}
                            </Label>
                            <TextArea
                                id="resource-upload-description"
                                rows={3}
                                className="resize-none"
                                placeholder={t("upload.descriptionField")}
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </TextField>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="resource-upload-type" className="text-sm">
                                {t("upload.typeLabel")}
                            </Label>
                            <select
                                id="resource-upload-type"
                                value={type}
                                disabled={isLocked}
                                onChange={(event) =>
                                    setType(event.target.value as ResourceTypeCode)
                                }
                                className={SELECT_CLASS}
                            >
                                {RESOURCE_TYPE_CODES.map((option) => (
                                    <option key={option} value={option}>
                                        {t(`upload.type.${option}`)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="resource-upload-subject" className="text-sm">
                                {t("upload.subjectLabel")}
                            </Label>
                            <select
                                id="resource-upload-subject"
                                value={subjectId}
                                disabled={isLocked || isLoadingSubjects}
                                onChange={(event) => setSubjectId(event.target.value)}
                                className={SELECT_CLASS}
                            >
                                <option value="">
                                    {isLoadingSubjects
                                        ? t("upload.subjectLoading")
                                        : t("upload.subjectPlaceholder")}
                                </option>
                                {subjects.map((subject) => (
                                    // the BE keys `subjectId` on the UUID, not the code
                                    <option key={subject.uuid} value={subject.uuid}>
                                        {subject.code} — {subject.name}
                                    </option>
                                ))}
                            </select>
                            {subjectsError ? (
                                <Typography type="body-xs" className="text-danger">
                                    {t("upload.subjectLoadError")}
                                </Typography>
                            ) : null}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="resource-upload-visibility" className="text-sm">
                                    {t("upload.visibilityLabel")}
                                </Label>
                                <select
                                    id="resource-upload-visibility"
                                    value={visibility}
                                    disabled={isLocked}
                                    onChange={(event) =>
                                        setVisibility(
                                            event.target.value as (typeof VISIBILITIES)[number],
                                        )
                                    }
                                    className={SELECT_CLASS}
                                >
                                    {VISIBILITIES.map((option) => (
                                        <option key={option} value={option}>
                                            {t(`upload.visibility.${option}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="resource-upload-license" className="text-sm">
                                    {t("upload.licenseLabel")}
                                </Label>
                                <select
                                    id="resource-upload-license"
                                    value={license}
                                    disabled={isLocked}
                                    onChange={(event) =>
                                        setLicense(
                                            event.target.value as (typeof LICENSES)[number],
                                        )
                                    }
                                    className={SELECT_CLASS}
                                >
                                    {LICENSES.map((option) => (
                                        <option key={option} value={option}>
                                            {t(`upload.license.${option}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </>
            ) : null}

            {isRunning || flow.error ? (
                <ResourceUploadProgress
                    steps={flow.steps}
                    labelOf={stepLabel}
                    progressLabel={t("upload.progressLabel")}
                />
            ) : null}

            {flow.error ? (
                <div
                    role="alert"
                    className="flex flex-col gap-2 rounded-2xl border border-danger/40 bg-danger/10 p-4"
                >
                    <div className="flex items-start gap-2">
                        <WarningCircleIcon aria-hidden focusable="false" className="mt-0.5 size-5 shrink-0 text-danger" />
                        <div className="flex flex-col gap-1">
                            <Typography type="body-sm" weight="medium">
                                {t(`upload.error.${flow.error.reason}`)}
                            </Typography>
                            <Typography type="body-xs" color="muted">
                                {t("upload.errorAtStep", {
                                    step: stepLabel(flow.error.step),
                                })}
                            </Typography>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="self-start"
                        isDisabled={isRunning || !flow.canRetry}
                        isPending={isRunning}
                        onPress={onRetry}
                    >
                        {t("upload.retry")}
                    </Button>
                </div>
            ) : null}

            {!isDone ? (
                <Button
                    variant="primary"
                    className="self-start"
                    isDisabled={!canSubmit}
                    isPending={isRunning}
                    onPress={onSubmit}
                >
                    {t("upload.submit")}
                </Button>
            ) : null}
        </div>
    )
}
