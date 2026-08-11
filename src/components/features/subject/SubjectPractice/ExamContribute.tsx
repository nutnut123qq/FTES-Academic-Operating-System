"use client"

import React, { useCallback, useMemo, useRef, useState } from "react"
import {
    Button,
    Chip,
    Input,
    Label,
    TextArea,
    TextField,
    Typography,
    cn,
    toast,
} from "@heroui/react"
import { CheckCircleIcon, ImageSquareIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useRestWithToast } from "@/modules/toast/hooks"
import { useMutateCreateFeAlbumSwr } from "@/components/features/resource/hooks/useMutateCreateFeAlbumSwr"
import { ResourceDropzone } from "@/components/features/resource/ResourceUpload/ResourceDropzone"
import { ResourceUploadProgress } from "@/components/features/resource/ResourceUpload/ResourceUploadProgress"
import { useResourceUploadFlow } from "@/components/features/resource/ResourceUpload/useResourceUploadFlow"
import type { ResourceUploadStep } from "@/components/features/resource/ResourceUpload/uploadFlow"
import {
    RESOURCE_TYPE_RULES,
    resourceAcceptAttribute,
    validateResourceFile,
    type ResourceFileRejection,
} from "@/components/features/resource/ResourceUpload/uploadRules"
import type { SubjectExamKind } from "../hooks/useQuerySubjectExamsSwr"

/** BE cap on an FE album (`FeAlbumView.maxImages`) — mirrored so the picker stops early. */
export const FE_ALBUM_MAX_IMAGES = 50

/** Picture types an FE album accepts. */
const ALBUM_MIME = ["image/png", "image/jpeg", "image/webp"]

/** Per-picture cap of an FE album, in MB (the FE resource rule). */
const ALBUM_MAX_IMAGE_MB = RESOURCE_TYPE_RULES.FE.maxSizeMb

/** One locally picked album picture (not uploaded yet — see {@link AlbumImagePicker}). */
interface AlbumPick {
    id: string
    file: File
    previewUrl: string
}

/**
 * Album picker for an FE contribution: up to {@link FE_ALBUM_MAX_IMAGES} pictures with
 * thumbnails, in pick order, each removable.
 *
 * Unlike the community `PostImagePicker` (which uploads every pick straight to
 * `POST /community/media`), this one holds the files LOCALLY: an album image can only be
 * posted to `POST /resources/{id}/images`, and that id does not exist until the resource
 * is created on submit. Pick order is the album order the BE stamps as `sortOrder`.
 */
const AlbumImagePicker = ({
    picks,
    onChange,
    isDisabled,
}: {
    picks: Array<AlbumPick>
    onChange: (next: Array<AlbumPick>) => void
    isDisabled: boolean
}) => {
    const t = useTranslations("subjects")
    const inputRef = useRef<HTMLInputElement>(null)

    const onFiles = useCallback(
        (fileList: FileList | null) => {
            if (!fileList || fileList.length === 0) {
                return
            }
            const room = FE_ALBUM_MAX_IMAGES - picks.length
            if (room <= 0) {
                toast.danger(
                    t("practice.exam.contribute.albumLimit", { max: FE_ALBUM_MAX_IMAGES }),
                )
                return
            }
            const files = Array.from(fileList)
            if (files.length > room) {
                toast.danger(
                    t("practice.exam.contribute.albumLimit", { max: FE_ALBUM_MAX_IMAGES }),
                )
            }
            const accepted = files.slice(0, room).filter((file) => {
                if (!ALBUM_MIME.includes(file.type)) {
                    toast.danger(t("practice.exam.contribute.albumInvalid"))
                    return false
                }
                if (file.size > ALBUM_MAX_IMAGE_MB * 1024 * 1024) {
                    toast.danger(
                        t("practice.exam.contribute.albumTooLarge", {
                            maxSize: ALBUM_MAX_IMAGE_MB,
                        }),
                    )
                    return false
                }
                return true
            })
            if (accepted.length === 0) {
                return
            }
            onChange([
                ...picks,
                ...accepted.map((file) => ({
                    id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
                    file,
                    previewUrl: URL.createObjectURL(file),
                })),
            ])
        },
        [picks, onChange, t],
    )

    const remove = useCallback(
        (id: string) => {
            const gone = picks.find((pick) => pick.id === id)
            if (gone) {
                URL.revokeObjectURL(gone.previewUrl)
            }
            onChange(picks.filter((pick) => pick.id !== id))
        },
        [picks, onChange],
    )

    return (
        <div className="flex flex-col gap-2">
            <input
                ref={inputRef}
                type="file"
                accept={ALBUM_MIME.join(",")}
                multiple
                hidden
                onChange={(event) => {
                    onFiles(event.target.files)
                    // Allow re-picking the same file after a removal.
                    event.target.value = ""
                }}
            />
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    size="sm"
                    variant="tertiary"
                    isDisabled={isDisabled || picks.length >= FE_ALBUM_MAX_IMAGES}
                    onPress={() => inputRef.current?.click()}
                >
                    <ImageSquareIcon aria-hidden focusable="false" className="size-4" />
                    {t("practice.exam.contribute.addImages")}
                </Button>
                <Typography type="body-xs" color="muted">
                    {t("practice.exam.contribute.albumCount", {
                        count: picks.length,
                        max: FE_ALBUM_MAX_IMAGES,
                    })}
                </Typography>
            </div>

            {picks.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {picks.map((pick, index) => (
                        <div
                            key={pick.id}
                            className="relative aspect-square overflow-hidden rounded-large border border-separator"
                        >
                            {/* Local object URL preview — next/image adds nothing for a blob. */}
                            <img
                                src={pick.previewUrl}
                                alt={t("practice.exam.contribute.imageAlt", {
                                    index: index + 1,
                                })}
                                className="size-full object-cover"
                            />
                            <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-2 text-xs font-medium text-white">
                                {index + 1}
                            </span>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="secondary"
                                aria-label={t("practice.exam.contribute.removeImage")}
                                className="absolute right-1 top-1"
                                isDisabled={isDisabled}
                                onPress={() => remove(pick.id)}
                            >
                                <XIcon aria-hidden focusable="false" className="size-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

/** Props for {@link ExamContribute}. */
export interface ExamContributeProps {
    /** Which exam flavour is being contributed. */
    kind: SubjectExamKind
    /** Subject **UUID** the contribution is filed under; `null` blocks the submit. */
    subjectUuid: string | null
    /** Close the panel (also called after a successful contribution's "done"). */
    onClose: () => void
    /** Re-read the subject's exam list once the contribution lands. */
    onContributed: () => void
}

/**
 * In-tab contribution entry point for a PE paper / FE album.
 *
 * - **PE** reuses the existing resumable publish chain
 *   (`useResourceUploadFlow`: `POST /resources` → `POST /{id}/versions` →
 *   `POST /{id}/submit`) with the type pinned to `PE`, so a failure retries from the
 *   step that failed instead of creating a second resource.
 * - **FE** cannot use that chain: an album's pictures go to
 *   `POST /resources/{id}/images`, which needs the resource to exist first — so it runs
 *   the sibling `useMutateCreateFeAlbumSwr` chain (create → N images → submit).
 *
 * Either way the result is surfaced honestly: an ordinary contributor's resource comes
 * back `PENDING_APPROVAL` and the panel says so (the material is not live yet), while
 * staff — whose `submit` publishes immediately — see the approved state. A
 * `rejectedReason` carried on the response is rendered rather than swallowed.
 *
 * @param props - {@link ExamContributeProps}
 */
export const ExamContribute = ({
    kind,
    subjectUuid,
    onClose,
    onContributed,
}: ExamContributeProps) => {
    const t = useTranslations("subjects")
    const { guard } = useRequireAuth()
    const runRest = useRestWithToast()

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    /** PE: the exam paper file. */
    const [file, setFile] = useState<File | null>(null)
    /** FE: the album pictures, in order. */
    const [picks, setPicks] = useState<Array<AlbumPick>>([])
    /** FE: pictures already uploaded by the running chain. */
    const [albumProgress, setAlbumProgress] = useState(0)

    const peFlow = useResourceUploadFlow()
    const feChain = useMutateCreateFeAlbumSwr()
    /** FE: the submitted resource, so the panel can render its review status. */
    const [feResult, setFeResult] = useState<{
        status: string
        rejectedReason?: string
        failed: number
    } | null>(null)

    const typeCode = kind === "pe" ? "PE" : "FE"
    const rule = RESOURCE_TYPE_RULES[typeCode]

    /** PE only: validation of the picked paper against the BE `ResourceType` gate. */
    const validation = useMemo(
        () => (kind === "pe" && file ? validateResourceFile(file, "PE") : null),
        [kind, file],
    )
    const fileError: ResourceFileRejection | null =
        validation && !validation.ok ? validation.reason : null

    const isRunning = peFlow.isRunning || feChain.isMutating
    const peDone = peFlow.result !== null
    const isDone = kind === "pe" ? peDone : feResult !== null

    const canSubmit =
        !isRunning &&
        !isDone &&
        subjectUuid !== null &&
        title.trim() !== "" &&
        (kind === "pe" ? validation?.ok === true : picks.length > 0)

    const runContribution = useCallback(async () => {
        if (!subjectUuid) {
            return
        }
        if (kind === "pe") {
            if (!file || validation === null || !validation.ok) {
                return
            }
            const outcome = await peFlow.run({
                file,
                title,
                description,
                type: "PE",
                subjectId: subjectUuid,
                mimeType: validation.mimeType,
            })
            if (outcome) {
                onContributed()
            }
            return
        }

        setAlbumProgress(0)
        const outcome = await runRest(() =>
            feChain.trigger({
                title,
                description,
                subjectId: subjectUuid,
                files: picks.map((pick) => pick.file),
                onProgress: (uploaded) => setAlbumProgress(uploaded),
            }),
        )
        if (outcome) {
            setFeResult({
                status: outcome.resource.status,
                rejectedReason: outcome.resource.rejectedReason,
                failed: outcome.failed,
            })
            onContributed()
        }
    }, [
        subjectUuid,
        kind,
        file,
        validation,
        peFlow,
        title,
        description,
        onContributed,
        runRest,
        feChain,
        picks,
    ])

    const onSubmit = guard(() => {
        void runContribution()
    }, "auth.context.uploadResource")

    const stepLabel = useCallback(
        (step: ResourceUploadStep) => t(`practice.exam.contribute.steps.${step}`),
        [t],
    )

    /** Status of the freshly contributed resource, whichever chain produced it. */
    const doneStatus =
        kind === "pe" ? (peFlow.result?.resource.status ?? null) : (feResult?.status ?? null)
    const doneRejectedReason =
        kind === "pe" ? peFlow.result?.resource.rejectedReason : feResult?.rejectedReason
    const isPendingReview = doneStatus === "PENDING_APPROVAL"

    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-separator p-4">
            <div className="flex items-center gap-2">
                <Typography type="body" weight="semibold" className="min-w-0 flex-1">
                    {t(`practice.exam.contribute.title.${kind}`)}
                </Typography>
                <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={t("practice.exam.contribute.close")}
                    onPress={onClose}
                >
                    <XIcon aria-hidden focusable="false" className="size-4" />
                </Button>
            </div>

            {isDone ? (
                <div
                    className={cn(
                        "flex flex-col gap-2 rounded-2xl border p-4",
                        isPendingReview
                            ? "border-warning/40 bg-warning/5"
                            : "border-success/40 bg-success/5",
                    )}
                >
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon
                            aria-hidden
                            focusable="false"
                            weight="fill"
                            className={cn(
                                "size-5",
                                isPendingReview ? "text-warning" : "text-success",
                            )}
                        />
                        <Typography type="body-sm" weight="semibold">
                            {isPendingReview
                                ? t("practice.exam.contribute.pendingTitle")
                                : t("practice.exam.contribute.publishedTitle")}
                        </Typography>
                    </div>
                    <Typography type="body-xs" color="muted">
                        {isPendingReview
                            ? t("practice.exam.contribute.pendingHint")
                            : t("practice.exam.contribute.publishedHint")}
                    </Typography>
                    {doneRejectedReason ? (
                        <Typography type="body-xs" className="text-danger">
                            {t("practice.exam.contribute.rejectedReason", {
                                reason: doneRejectedReason,
                            })}
                        </Typography>
                    ) : null}
                    {kind === "fe" && feResult && feResult.failed > 0 ? (
                        <Typography type="body-xs" className="text-danger">
                            {t("practice.exam.contribute.albumPartial", {
                                count: feResult.failed,
                            })}
                        </Typography>
                    ) : null}
                    <Button
                        size="sm"
                        variant="tertiary"
                        className="self-start"
                        onPress={onClose}
                    >
                        {t("practice.exam.contribute.done")}
                    </Button>
                </div>
            ) : (
                <>
                    <TextField variant="primary" className="w-full" isDisabled={isRunning}>
                        <Label htmlFor="exam-contribute-title" className="text-sm">
                            {t("practice.exam.contribute.titleLabel")}
                        </Label>
                        <Input
                            id="exam-contribute-title"
                            variant="primary"
                            placeholder={t("practice.exam.contribute.titlePlaceholder")}
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                        />
                    </TextField>

                    <TextField variant="primary" className="w-full" isDisabled={isRunning}>
                        <Label htmlFor="exam-contribute-description" className="text-sm">
                            {t("practice.exam.contribute.descriptionLabel")}
                        </Label>
                        <TextArea
                            id="exam-contribute-description"
                            rows={2}
                            className="resize-none"
                            placeholder={t("practice.exam.contribute.descriptionPlaceholder")}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                    </TextField>

                    {kind === "pe" ? (
                        <ResourceDropzone
                            file={file}
                            onSelect={setFile}
                            accept={resourceAcceptAttribute("PE")}
                            label={t("practice.exam.contribute.paperDropzone")}
                            hint={t("practice.exam.contribute.paperHint", {
                                extensions: rule.extensions.join(", "),
                                maxSize: rule.maxSizeMb,
                            })}
                            clearLabel={t("practice.exam.contribute.clearFile")}
                            isDisabled={isRunning}
                            error={
                                fileError
                                    ? t(`practice.exam.contribute.fileError.${fileError}`, {
                                        extensions: rule.extensions.join(", "),
                                        maxSize: rule.maxSizeMb,
                                    })
                                    : null
                            }
                        />
                    ) : (
                        <AlbumImagePicker
                            picks={picks}
                            onChange={setPicks}
                            isDisabled={isRunning}
                        />
                    )}

                    {kind === "pe" && (peFlow.isRunning || peFlow.error) ? (
                        <ResourceUploadProgress
                            steps={peFlow.steps}
                            labelOf={stepLabel}
                            progressLabel={t("practice.exam.contribute.progressLabel")}
                        />
                    ) : null}

                    {kind === "fe" && feChain.isMutating ? (
                        <Chip size="sm" variant="soft" color="accent" className="w-fit">
                            {t("practice.exam.contribute.albumUploading", {
                                uploaded: albumProgress,
                                total: picks.length,
                            })}
                        </Chip>
                    ) : null}

                    {kind === "pe" && peFlow.error ? (
                        <div
                            role="alert"
                            className="flex flex-col gap-2 rounded-2xl border border-danger/40 bg-danger/10 p-3"
                        >
                            <div className="flex items-start gap-2">
                                <WarningCircleIcon
                                    aria-hidden
                                    focusable="false"
                                    className="mt-0.5 size-4 shrink-0 text-danger"
                                />
                                <Typography type="body-sm">
                                    {t(`practice.exam.contribute.error.${peFlow.error.reason}`)}
                                </Typography>
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="self-start"
                                isDisabled={isRunning || !peFlow.canRetry}
                                isPending={isRunning}
                                onPress={() => {
                                    void peFlow.retry()
                                }}
                            >
                                {t("practice.exam.contribute.retry")}
                            </Button>
                        </div>
                    ) : null}

                    {subjectUuid === null ? (
                        <Typography type="body-xs" className="text-danger">
                            {t("practice.exam.contribute.subjectUnresolved")}
                        </Typography>
                    ) : null}

                    <Button
                        variant="primary"
                        className="self-start"
                        isDisabled={!canSubmit}
                        isPending={isRunning}
                        onPress={onSubmit}
                    >
                        {t("practice.exam.contribute.submit")}
                    </Button>
                </>
            )}
        </section>
    )
}
