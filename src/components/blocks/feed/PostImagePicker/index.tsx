"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Button, Typography, cn, toast } from "@heroui/react"
import { ImageSquareIcon, XIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { uploadCommunityMedia } from "@/modules/api/rest/community"
import type { MediaInput } from "@/modules/api/rest/community/types"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Max attachments per post — mirrors the BE `MAX_MEDIA`. */
export const MAX_POST_IMAGES = 4
/** Max bytes per image — mirrors the BE `COMMUNITY_MEDIA_TOO_LARGE` threshold. */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
/** Accepted types — mirrors the BE whitelist. */
const ACCEPTED_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"]

/** One pick in the picker: uploading (local preview only) or uploaded (has a storage key). */
interface Pick {
    /** Local id — stable across the upload so the row can be replaced in place. */
    id: string
    /** Object URL for the instant preview; revoked when the pick goes away. */
    previewUrl: string
    /** Set once the upload lands; until then the pick is still in flight. */
    storageKey?: string
    mimeType: string
    sizeBytes: number
}

/** Props for {@link PostImagePicker}. */
export interface PostImagePickerProps extends WithClassNames<undefined> {
    /**
     * Called whenever the set of successfully uploaded images changes. The composer
     * sends these verbatim as the post's `media`.
     */
    onChange: (media: Array<MediaInput>) => void
    /**
     * Called when an upload starts or the last one settles — the composer disables
     * submit while this is true so a post can't be created without its images.
     */
    onUploadingChange: (isUploading: boolean) => void
    /** Bump this to clear every pick (the composer does it after a successful post). */
    resetToken?: number
}

/**
 * Image attachment picker for the community composers: pick up to
 * {@link MAX_POST_IMAGES} images, preview them, drop any of them, and upload each
 * one as soon as it is picked (`POST /api/v1/community/media`).
 *
 * Uploading on pick — rather than on submit — surfaces upload failures while the
 * author is still writing, and keeps submitting the post a single fast request.
 * Size/type are checked here before any request; the server enforces the same
 * limits again.
 *
 * A failed upload drops that pick and toasts, leaving the rest of the draft alone.
 *
 * @param props - {@link PostImagePickerProps}
 */
export const PostImagePicker = ({
    onChange,
    onUploadingChange,
    resetToken = 0,
    className,
}: PostImagePickerProps) => {
    const t = useTranslations("communityHub")
    const inputRef = useRef<HTMLInputElement>(null)
    const [picks, setPicks] = useState<Array<Pick>>([])
    /** Mirror of `picks` so the file handler can read the count without depending on state. */
    const picksRef = useRef<Array<Pick>>([])
    picksRef.current = picks

    // Report the uploaded subset + in-flight state upward on every change.
    useEffect(() => {
        onChange(
            picks
                .filter((pick): pick is Pick & { storageKey: string } => Boolean(pick.storageKey))
                .map((pick) => ({
                    mediaType: "IMAGE",
                    storageKey: pick.storageKey,
                    mimeType: pick.mimeType,
                    sizeBytes: pick.sizeBytes,
                })),
        )
        onUploadingChange(picks.some((pick) => !pick.storageKey))
    }, [picks, onChange, onUploadingChange])

    // Clearing happens through a token instead of a callback so the composer can reset
    // the picker after a successful post without holding a ref to it.
    useEffect(() => {
        if (resetToken === 0) {
            return
        }
        setPicks((current) => {
            current.forEach((pick) => URL.revokeObjectURL(pick.previewUrl))
            return []
        })
    }, [resetToken])

    const remove = useCallback((id: string) => {
        setPicks((current) => {
            const gone = current.find((pick) => pick.id === id)
            if (gone) {
                URL.revokeObjectURL(gone.previewUrl)
            }
            return current.filter((pick) => pick.id !== id)
        })
    }, [])

    const onFiles = useCallback(
        async (fileList: FileList | null) => {
            if (!fileList || fileList.length === 0) {
                return
            }
            const files = Array.from(fileList)
            // Validation + object-URL creation happen OUTSIDE the state updater: an updater must
            // stay pure (StrictMode runs it twice, which would double-toast and double-upload).
            // `picksRef` carries the current count without making this callback depend on state.
            const room = MAX_POST_IMAGES - picksRef.current.length
            if (room <= 0 || files.length > room) {
                toast.danger(t("composer.imageLimit", { max: MAX_POST_IMAGES }))
                if (room <= 0) {
                    return
                }
            }
            const accepted = files
                .slice(0, room)
                .filter((file) => {
                    if (!ACCEPTED_MIME.includes(file.type)) {
                        toast.danger(t("composer.imageInvalid"))
                        return false
                    }
                    if (file.size > MAX_IMAGE_BYTES) {
                        toast.danger(t("composer.imageTooLarge"))
                        return false
                    }
                    return true
                })
                .map((file) => ({
                    file,
                    pick: {
                        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
                        previewUrl: URL.createObjectURL(file),
                        mimeType: file.type,
                        sizeBytes: file.size,
                    } satisfies Pick,
                }))
            if (accepted.length === 0) {
                return
            }
            setPicks((current) => [...current, ...accepted.map((entry) => entry.pick)])

            await Promise.all(
                accepted.map(async ({ file, pick }) => {
                    try {
                        const uploaded = await uploadCommunityMedia(file)
                        setPicks((current) =>
                            current.map((item) =>
                                item.id === pick.id
                                    ? { ...item, storageKey: uploaded.secureUrl }
                                    : item,
                            ),
                        )
                    } catch {
                        toast.danger(t("composer.imageUploadFailed"))
                        remove(pick.id)
                    }
                }),
            )
        },
        [remove, t],
    )

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_MIME.join(",")}
                multiple
                hidden
                onChange={(event) => {
                    void onFiles(event.target.files)
                    // Allow re-picking the same file after a removal.
                    event.target.value = ""
                }}
            />
            <Button
                size="sm"
                variant="tertiary"
                className="self-start"
                isDisabled={picks.length >= MAX_POST_IMAGES}
                onPress={() => inputRef.current?.click()}
            >
                <ImageSquareIcon aria-hidden focusable="false" className="size-4" />
                {t("composer.addImage")}
            </Button>

            {picks.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                    {picks.map((pick) => (
                        <div
                            key={pick.id}
                            className="relative aspect-square overflow-hidden rounded-large border border-separator"
                        >
                            {/* Local object URL preview — next/image adds nothing for a blob. */}
                            <img
                                src={pick.previewUrl}
                                alt={t("composer.imageAlt")}
                                className={cn(
                                    "size-full object-cover",
                                    !pick.storageKey && "opacity-50",
                                )}
                            />
                            {!pick.storageKey ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Typography type="body-xs" color="muted">
                                        {t("composer.imageUploading")}
                                    </Typography>
                                </div>
                            ) : null}
                            <Button
                                isIconOnly
                                size="sm"
                                variant="secondary"
                                aria-label={t("composer.removeImage")}
                                className="absolute right-1 top-1"
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
