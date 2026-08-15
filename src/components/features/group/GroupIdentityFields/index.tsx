"use client"

import React, { useRef } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AvatarUploadButton } from "@/components/blocks/identity/AvatarUploadButton"
import { ImageDropzone } from "@/components/blocks/identity/ImageDropzone"
import type { GroupMediaKind } from "@/modules/api/rest/group"
import type { IdentityImagePickerHandle } from "../hooks/useIdentityImagePicker"

/** Props for {@link GroupIdentityFields}. */
interface GroupIdentityFieldsProps {
    /** Group name — drives alt text + avatar fallback initials. */
    name: string
    /** Avatar picker handle (from `useIdentityImagePicker`). */
    avatar: IdentityImagePickerHandle
    /** Cover picker handle (from `useIdentityImagePicker`). */
    cover: IdentityImagePickerHandle
    /**
     * Owner-supplied remove handler. The create form omits it — nothing is stored yet, so
     * dropping a pick is purely local — while the management section passes one that tells
     * an unsaved pick (local drop) apart from an image the server holds (confirm → DELETE).
     * Absent ⇒ the button falls back to the picker's own local `remove`.
     */
    onRemove?: (kind: GroupMediaKind) => void
    /** Which image is being cleared server-side right now; its button is disabled. */
    removingKind?: GroupMediaKind | null
}

/**
 * Shared identity pickers for a group (§7): a circular avatar upload trigger
 * (hidden file input, same validation as the dropzone) and a cover dropzone
 * that turns into a banner-ratio preview once a file is accepted. Both show
 * inline i18n errors on rejected type/size and a remove action. Used by the
 * create form and the management identity section (which pre-seeds the
 * handles from the group's saved images). This component only picks + previews;
 * the owning form uploads for real (presign → PUT → verify via
 * `useMutateGroupMediaSwr`) and, when it passes `onRemove`, decides whether a
 * removal is a local drop or a server-side clear.
 */
export const GroupIdentityFields = ({
    name,
    avatar,
    cover,
    onRemove,
    removingKind,
}: GroupIdentityFieldsProps) => {
    const t = useTranslations("groupsHub")
    const avatarInputRef = useRef<HTMLInputElement>(null)
    const altName = name.trim() || t("title")

    return (
        <div className="flex flex-col gap-3">
            {/* avatar picker — circular trigger + hidden file input */}
            <div className="flex items-center gap-3">
                <AvatarUploadButton
                    avatar={avatar.shown}
                    displayName={name.trim() || null}
                    /* A group is NOT a person. The generated (DiceBear) default draws a
                       FACE, so seeding it here gave every photo-less group a human head —
                       it reads as "a member", not "a study group". An entity avatar must
                       stay on the initials tile.
                       It has to be the EMPTY STRING, not null/undefined: `UserAvatar`
                       seeds on `seed ?? username`, so a nullish seed would just fall
                       through to the group name and draw the face anyway. "" is the
                       documented "no seed to hash" value (see `dicebearAvatarUrl`). */
                    seed=""
                    label={t("identity.avatarLabel")}
                    onPress={() => avatarInputRef.current?.click()}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0">
                    <Typography type="body-sm" weight="medium">
                        {t("identity.avatarLabel")}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("identity.avatarHint")}
                    </Typography>
                    {avatar.shown ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="self-start"
                            isPending={removingKind === "AVATAR"}
                            onPress={() =>
                                onRemove ? onRemove("AVATAR") : avatar.remove()
                            }
                        >
                            {t("identity.remove")}
                        </Button>
                    ) : null}
                </div>
            </div>
            <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                    const next = event.target.files?.[0]
                    if (next) {
                        avatar.accept(next)
                    }
                    // allow re-picking the same file
                    event.target.value = ""
                }}
            />
            {avatar.error ? (
                <Typography type="body-xs" className="text-danger">
                    {t(`identity.${avatar.error}`)}
                </Typography>
            ) : null}

            {/* cover picker — dropzone, swapped for a banner-ratio preview when set */}
            <Typography type="body-sm" weight="medium">
                {t("identity.coverLabel")}
            </Typography>
            {cover.shown ? (
                <div className="flex flex-col gap-2">
                    <img
                        src={cover.shown}
                        alt={t("identity.coverAlt", { name: altName })}
                        className="aspect-[3/1] w-full rounded-large object-cover"
                    />
                    <Button
                        size="sm"
                        variant="ghost"
                        className="self-start"
                        isPending={removingKind === "COVER"}
                        onPress={() => (onRemove ? onRemove("COVER") : cover.remove())}
                    >
                        {t("identity.remove")}
                    </Button>
                </div>
            ) : (
                <ImageDropzone
                    onFile={cover.accept}
                    onReject={cover.reject}
                    label={t("identity.uploadCta")}
                    hint={t("identity.coverHint")}
                />
            )}
            {cover.error ? (
                <Typography type="body-xs" className="text-danger">
                    {t(`identity.${cover.error}`)}
                </Typography>
            ) : null}
        </div>
    )
}
