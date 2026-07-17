"use client"

import React, { useRef } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AvatarUploadButton } from "@/components/blocks/identity/AvatarUploadButton"
import { ImageDropzone } from "@/components/blocks/identity/ImageDropzone"
import type { IdentityImagePickerHandle } from "../hooks/useIdentityImagePicker"

/** Props for {@link GroupIdentityFields}. */
interface GroupIdentityFieldsProps {
    /** Group name — drives alt text + avatar fallback initials. */
    name: string
    /** Avatar picker handle (from `useIdentityImagePicker`). */
    avatar: IdentityImagePickerHandle
    /** Cover picker handle (from `useIdentityImagePicker`). */
    cover: IdentityImagePickerHandle
}

/**
 * Shared identity pickers for a group (§7): a circular avatar upload trigger
 * (hidden file input, same validation as the dropzone) and a cover dropzone
 * that turns into a banner-ratio preview once a file is accepted. Both show
 * inline i18n errors on rejected type/size and a remove action. Used by the
 * create form and the management identity section (which pre-seeds the
 * handles from the group's saved images). This component only picks + previews;
 * the owning form uploads for real (presign → PUT → verify via
 * `useMutateGroupMediaSwr`).
 */
export const GroupIdentityFields = ({ name, avatar, cover }: GroupIdentityFieldsProps) => {
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
                    seed={name.trim() || null}
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
                        <Button size="sm" variant="ghost" className="self-start" onPress={avatar.remove}>
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
                    <Button size="sm" variant="ghost" className="self-start" onPress={cover.remove}>
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
