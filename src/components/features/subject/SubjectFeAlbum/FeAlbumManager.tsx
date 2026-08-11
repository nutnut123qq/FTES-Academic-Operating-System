"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button, Chip, Typography, toast } from "@heroui/react"
import {
    ArrowDownIcon,
    ArrowUpIcon,
    FolderIcon,
    ImageSquareIcon,
    TrashIcon,
    XIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { ConfirmDialog } from "@/components/reuseable/PostEngagementBar"
import { classifyResourceUploadError } from "@/components/features/resource/ResourceUpload/uploadFlow"
import { triageAlbumPick } from "@/components/features/resource/ResourceUpload/albumFolderPick"
import {
    FE_ALBUM_IMAGE_MIME,
    FE_ALBUM_MAX_IMAGE_MB,
} from "@/components/features/resource/ResourceUpload/uploadRules"
import { FE_IMAGE_UPLOAD_RATE, moveFeAlbumImage } from "@/components/features/resource/hooks/feAlbumManage"
import { useMutateAddFeAlbumImagesSwr } from "@/components/features/resource/hooks/useMutateAddFeAlbumImagesSwr"
import { useMutateDeleteFeAlbumImageSwr } from "@/components/features/resource/hooks/useMutateDeleteFeAlbumImageSwr"
import { useMutateReorderFeAlbumImagesSwr } from "@/components/features/resource/hooks/useMutateReorderFeAlbumImagesSwr"
import type { FeImageView } from "@/modules/api/rest/resource"

/** Props for {@link FeAlbumManager}. */
export interface FeAlbumManagerProps {
    /** The FE resource (album) being managed. */
    resourceId: string
    /** The album's pictures in the server's current order. */
    images: Array<FeImageView>
    /** The BE cap the album payload ships (`FeAlbumView.maxImages`). */
    maxImages: number
    /** Revalidate the album SWR entry after any write lands. */
    onMutated: () => void
    /** Close the panel. */
    onClose: () => void
}

/**
 * Curator panel of an FE album: append pictures, drop one, reorder.
 *
 * **Who may use it is the SERVER's call.** The BE allows the resource owner OR a subject
 * curator, and a curator's grant is scoped to the SUBJECT — it is not in the viewer's
 * global permission leaf list, so a client-side permission gate would hide these
 * controls from exactly the people who need them (the bug this surface's sibling,
 * `ExamModerationQueue`, already carries a comment about). The album payload exposes no
 * `canManage` flag either, so the panel is offered to any SIGNED-IN viewer and a
 * refusal is surfaced verbatim from the `403` instead of being guessed at.
 *
 * The three writes mirror the endpoint contracts:
 * - **add** — one `POST /images` per picture, sequential and self-paced against the
 *   10/min · 60/hour limit, stopping cleanly on a persistent `RESOURCE_RATE_LIMITED`
 *   (see `useMutateAddFeAlbumImagesSwr`); the album cap is enforced at pick time with the
 *   overflow reported, never silently dropped. Pictures come either from a file pick or
 *   from a WHOLE FOLDER (`<input webkitdirectory>`, sub-folders included) — both go
 *   through the same `triageAlbumPick` filter and the same sequential upload, so a
 *   50-image folder self-throttles exactly like a 50-file selection;
 * - **delete** — behind a {@link ConfirmDialog}, because the picture's whole comment
 *   thread goes with it;
 * - **reorder** — up/down buttons; every move ships the album's COMPLETE id permutation,
 *   which is what `PUT /images/order` demands.
 *
 * Every settled write calls `onMutated`, so the viewer's carousel, filmstrip and
 * per-image comment pane re-read the same album SWR entry.
 *
 * @param props - {@link FeAlbumManagerProps}
 */
export const FeAlbumManager = ({
    resourceId,
    images,
    maxImages,
    onMutated,
    onClose,
}: FeAlbumManagerProps) => {
    const t = useTranslations("subjects")
    const inputRef = useRef<HTMLInputElement>(null)
    const folderInputRef = useRef<HTMLInputElement | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    const addImages = useMutateAddFeAlbumImagesSwr()
    const deleteImage = useMutateDeleteFeAlbumImageSwr()
    const reorderImages = useMutateReorderFeAlbumImagesSwr()

    /** Optimistic order while a reorder is in flight; `null` = render the server's. */
    const [pendingOrder, setPendingOrder] = useState<Array<string> | null>(null)
    /** Picture awaiting delete confirmation. */
    const [deleting, setDeleting] = useState<FeImageView | null>(null)
    /** Pictures already landed by the running bulk add. */
    const [progress, setProgress] = useState({ done: 0, total: 0 })
    /** Seconds the pacer / backoff is currently sleeping (`0` = running). */
    const [waitingSeconds, setWaitingSeconds] = useState(0)

    const serverIds = images.map((image) => image.id).join(",")
    // The server list changed (our reorder landed, or someone else edited the album):
    // its order is the truth again, so drop the optimistic one.
    useEffect(() => {
        setPendingOrder(null)
    }, [serverIds])

    const ordered = useMemo(() => {
        if (pendingOrder === null) {
            return images
        }
        const byId = new Map(images.map((image) => [image.id, image]))
        return pendingOrder
            .map((id) => byId.get(id))
            .filter((image): image is FeImageView => image !== undefined)
    }, [images, pendingOrder])

    const remaining = Math.max(0, maxImages - images.length)
    const isBusy = addImages.isMutating || deleteImage.isMutating || reorderImages.isMutating

    /** Maps any refusal onto the panel's own copy (403 included). */
    const failureText = useCallback(
        (error: unknown) =>
            t(`practice.fe.manage.error.${classifyResourceUploadError(error).reason}`),
        [t],
    )

    // ------------------------------------------------------------------ add

    const runAdd = useCallback(
        async (files: Array<File>) => {
            const controller = new AbortController()
            abortRef.current = controller
            setProgress({ done: 0, total: files.length })
            setWaitingSeconds(0)
            try {
                const outcome = await addImages.trigger({
                    resourceId,
                    files,
                    onProgress: (done, total) => setProgress({ done, total }),
                    onWait: (waitMs) => setWaitingSeconds(Math.ceil(waitMs / 1_000)),
                    signal: controller.signal,
                })
                if (!outcome) {
                    return
                }
                if (outcome.uploaded > 0) {
                    onMutated()
                }
                if (outcome.cancelled) {
                    toast.danger(
                        t("practice.fe.manage.cancelled", { uploaded: outcome.uploaded }),
                    )
                } else if (outcome.stoppedByRateLimit) {
                    toast.danger(
                        t("practice.fe.manage.uploadStopped", { uploaded: outcome.uploaded }),
                    )
                } else if (outcome.failed > 0) {
                    toast.danger(
                        t("practice.fe.manage.uploadPartial", {
                            uploaded: outcome.uploaded,
                            failed: outcome.failed,
                        }),
                    )
                } else {
                    toast.success(
                        t("practice.fe.manage.uploaded", { count: outcome.uploaded }),
                    )
                }
                if (outcome.uploaded === 0 && outcome.firstErrorReason !== null) {
                    toast.danger(t(`practice.fe.manage.error.${outcome.firstErrorReason}`))
                }
            } catch (error) {
                toast.danger(failureText(error))
            } finally {
                abortRef.current = null
                setWaitingSeconds(0)
                setProgress({ done: 0, total: 0 })
            }
        },
        [addImages, resourceId, onMutated, t, failureText],
    )

    /**
     * Validates a pick — loose files OR a whole folder — against the cap + the album's
     * picture rules, then hands the survivors to the SAME sequential, self-paced add.
     *
     * A folder pick is additionally ordered naturally by relative path (`de2` before
     * `de10`), since arrival order is the `sortOrder` the BE stamps.
     *
     * @param fileList - what the input produced.
     * @param fromFolder - the pick came from the `webkitdirectory` input.
     */
    const onPick = useCallback(
        (fileList: FileList | null, fromFolder: boolean) => {
            const picked = fileList ? Array.from(fileList) : []
            if (picked.length === 0) {
                if (fromFolder) {
                    toast.danger(t("practice.fe.manage.folderEmpty"))
                }
                return
            }
            if (remaining <= 0) {
                toast.danger(t("practice.fe.manage.full", { max: maxImages }))
                return
            }
            // The cap is enforced here, and what does not fit is REPORTED — a silently
            // truncated pick would look like an upload that lost pictures.
            const triage = triageAlbumPick(picked, {
                room: remaining,
                maxImageMb: FE_ALBUM_MAX_IMAGE_MB,
                sortByPath: fromFolder,
            })

            if (triage.wrongType > 0) {
                toast.danger(
                    t("practice.fe.manage.invalidType", { count: triage.wrongType }),
                )
            }
            if (triage.tooLarge > 0) {
                toast.danger(
                    t("practice.fe.manage.tooLargeSkipped", {
                        count: triage.tooLarge,
                        maxSize: FE_ALBUM_MAX_IMAGE_MB,
                    }),
                )
            }
            if (triage.droppedOverCap > 0) {
                toast.danger(
                    t("practice.fe.manage.overflow", {
                        accepted: triage.accepted.length,
                        dropped: triage.droppedOverCap,
                        max: maxImages,
                    }),
                )
            }
            if (triage.accepted.length === 0) {
                if (fromFolder && triage.wrongType === 0 && triage.tooLarge === 0) {
                    toast.danger(t("practice.fe.manage.folderEmpty"))
                }
                return
            }
            void runAdd(triage.accepted)
        },
        [remaining, maxImages, t, runAdd],
    )

    // ------------------------------------------------------------------ reorder

    const move = useCallback(
        async (from: number, to: number) => {
            const currentImageIds = images.map((image) => image.id)
            const nextIds = moveFeAlbumImage(
                ordered.map((image) => image.id),
                from,
                to,
            )
            setPendingOrder(nextIds)
            try {
                await reorderImages.trigger({
                    resourceId,
                    imageIds: nextIds,
                    currentImageIds,
                })
                onMutated()
            } catch (error) {
                setPendingOrder(null)
                toast.danger(failureText(error))
            }
        },
        [images, ordered, reorderImages, resourceId, onMutated, failureText],
    )

    // ------------------------------------------------------------------ delete

    const confirmDelete = useCallback(async () => {
        if (!deleting) {
            return
        }
        try {
            await deleteImage.trigger({ resourceId, imageId: deleting.id })
            setDeleting(null)
            onMutated()
            toast.success(t("practice.fe.manage.deleted"))
        } catch (error) {
            setDeleting(null)
            toast.danger(failureText(error))
        }
    }, [deleting, deleteImage, resourceId, onMutated, t, failureText])

    return (
        <section className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <div className="flex items-center gap-2">
                <Typography type="body" weight="semibold" className="min-w-0 flex-1">
                    {t("practice.fe.manage.title")}
                </Typography>
                <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={t("practice.fe.manage.close")}
                    isDisabled={isBusy}
                    onPress={onClose}
                >
                    <XIcon aria-hidden focusable="false" className="size-4" />
                </Button>
            </div>

            <Typography type="body-xs" color="muted">
                {t("practice.fe.manage.permissionHint")}
            </Typography>

            <input
                ref={inputRef}
                type="file"
                accept={FE_ALBUM_IMAGE_MIME.join(",")}
                multiple
                hidden
                onChange={(event) => {
                    onPick(event.target.files, false)
                    // Let the same file be picked again after a removal.
                    event.target.value = ""
                }}
            />
            {/* Folder picker — `webkitdirectory`/`directory` are set imperatively via the
                ref callback because React's `input` typings carry neither. */}
            <input
                ref={(el) => {
                    if (el) {
                        el.setAttribute("webkitdirectory", "")
                        el.setAttribute("directory", "")
                    }
                    folderInputRef.current = el
                }}
                type="file"
                hidden
                aria-label={t("practice.fe.manage.addFolder")}
                onChange={(event) => {
                    onPick(event.target.files, true)
                    // Let the same folder be picked again after a removal.
                    event.target.value = ""
                }}
            />

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={isBusy || remaining <= 0}
                    onPress={() => inputRef.current?.click()}
                >
                    <ImageSquareIcon aria-hidden focusable="false" className="size-4" />
                    {t("practice.fe.manage.add")}
                </Button>
                <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={isBusy || remaining <= 0}
                    onPress={() => folderInputRef.current?.click()}
                >
                    <FolderIcon aria-hidden focusable="false" className="size-4" />
                    {t("practice.fe.manage.addFolder")}
                </Button>
                <Typography type="body-xs" color="muted">
                    {t("practice.fe.manage.slots", { remaining, max: maxImages })}
                </Typography>
                {addImages.isMutating ? (
                    <>
                        <Chip size="sm" variant="soft" color="accent">
                            {t("practice.fe.manage.uploading", {
                                done: progress.done,
                                total: progress.total,
                            })}
                        </Chip>
                        <Button
                            size="sm"
                            variant="tertiary"
                            onPress={() => abortRef.current?.abort()}
                        >
                            {t("practice.fe.manage.cancel")}
                        </Button>
                    </>
                ) : null}
            </div>

            <Typography type="body-xs" color="muted">
                {t("practice.fe.manage.folderHint")}
            </Typography>

            {waitingSeconds > 0 ? (
                <Typography type="body-xs" color="muted" role="status">
                    {t("practice.fe.manage.throttled", {
                        seconds: waitingSeconds,
                        perMinute: FE_IMAGE_UPLOAD_RATE.perMinute,
                    })}
                </Typography>
            ) : null}

            {ordered.length > 0 ? (
                <ul className="flex flex-col gap-2">
                    {ordered.map((image, position) => (
                        <li
                            key={image.id}
                            className="flex items-center gap-3 rounded-large border border-separator p-2"
                        >
                            {/* Remote storage host — next/image would need a
                                remotePatterns entry it does not have. */}
                            <img
                                src={image.imageUrl}
                                alt=""
                                className="size-12 shrink-0 rounded-large object-cover"
                            />
                            <div className="min-w-0 flex-1">
                                <Typography type="body-sm" weight="medium">
                                    {t("practice.fe.manage.position", {
                                        index: position + 1,
                                    })}
                                </Typography>
                                {image.caption ? (
                                    <Typography type="body-xs" color="muted" truncate>
                                        {image.caption}
                                    </Typography>
                                ) : null}
                            </div>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                aria-label={t("practice.fe.manage.moveUp")}
                                isDisabled={isBusy || position === 0}
                                onPress={() => {
                                    void move(position, position - 1)
                                }}
                            >
                                <ArrowUpIcon
                                    aria-hidden
                                    focusable="false"
                                    className="size-4"
                                />
                            </Button>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                aria-label={t("practice.fe.manage.moveDown")}
                                isDisabled={isBusy || position === ordered.length - 1}
                                onPress={() => {
                                    void move(position, position + 1)
                                }}
                            >
                                <ArrowDownIcon
                                    aria-hidden
                                    focusable="false"
                                    className="size-4"
                                />
                            </Button>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                aria-label={t("practice.fe.manage.delete")}
                                isDisabled={isBusy}
                                onPress={() => setDeleting(image)}
                                className="text-danger"
                            >
                                <TrashIcon aria-hidden focusable="false" className="size-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <Typography type="body-xs" color="muted">
                    {t("practice.fe.manage.emptyAlbum")}
                </Typography>
            )}

            <ConfirmDialog
                isOpen={deleting !== null}
                onClose={() => setDeleting(null)}
                onConfirm={() => {
                    void confirmDelete()
                }}
                title={t("practice.fe.manage.deleteTitle")}
                description={t("practice.fe.manage.deleteDescription")}
                confirmLabel={t("practice.fe.manage.deleteConfirm")}
                isPending={deleteImage.isMutating}
            />
        </section>
    )
}
