"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { clearGroupMedia, type GroupMediaKind } from "@/modules/api/rest/group"
import { useRestWithToast } from "@/modules/toast/hooks"
import { ConfirmDialog } from "@/components/reuseable/PostEngagementBar"
import { GroupIdentityFields } from "../GroupIdentityFields"
import { useIdentityImagePicker } from "../hooks/useIdentityImagePicker"
import { useMutateGroupMediaSwr } from "../hooks/useMutateGroupMediaSwr"
import { useQueryGroupSwr, type GroupHeader } from "../hooks/useQueryGroupSwr"

/** Props for {@link GroupIdentitySection}. */
export interface GroupIdentitySectionProps {
    /** Group being managed. */
    groupId: string
}

/** Both images this section manages, in the order the save button flushes them. */
const MEDIA_KINDS: Array<GroupMediaKind> = ["AVATAR", "COVER"]

/**
 * "Group identity" section of the management tab: the avatar + cover pickers with
 * their two real writes —
 *  - **upload**: presign → PUT → verify (`useMutateGroupMediaSwr`), and
 *  - **remove**: `DELETE /groups/{id}/media/{AVATAR|COVER}` (idempotent, `group.manage`).
 *
 * "Gỡ ảnh" reads the state it is actually in: a pick that has NOT been saved yet is
 * simply dropped from the preview (no request — there is nothing on the server to
 * delete), while an image the group already has goes through a confirm and then the
 * real clear, after which the group header cache is patched so the avatar/cover
 * disappears everywhere without a refetch.
 *
 * A clear that failed (or was aborted mid-flight) leaves the picker showing nothing
 * while the server still holds the image; that is a PENDING CHANGE, so the save
 * button stays enabled for it — removing an image without picking a new one is a
 * saveable edit, not a no-op.
 *
 * @param props - {@link GroupIdentitySectionProps}
 */
export const GroupIdentitySection = ({ groupId }: GroupIdentitySectionProps) => {
    const t = useTranslations("groupsHub")
    const runRest = useRestWithToast()
    const { group, mutate } = useQueryGroupSwr(groupId)
    const avatar = useIdentityImagePicker(group?.avatarUrl ?? null)
    const cover = useIdentityImagePicker(group?.coverUrl ?? null)
    const { upload } = useMutateGroupMediaSwr(groupId)
    const [isSaving, setIsSaving] = useState(false)
    const [pendingClear, setPendingClear] = useState<GroupMediaKind | null>(null)
    const [isClearing, setIsClearing] = useState(false)

    const pickerOf = (kind: GroupMediaKind) => (kind === "AVATAR" ? avatar : cover)
    const savedUrlOf = (kind: GroupMediaKind) =>
        (kind === "AVATAR" ? group?.avatarUrl : group?.coverUrl) ?? null

    /** True when the picker shows nothing but the group still has that image saved. */
    const needsClear = (kind: GroupMediaKind) => {
        const picker = pickerOf(kind)
        return picker.file === null && picker.shown === null && savedUrlOf(kind) !== null
    }

    const hasPendingChange =
        Boolean(avatar.file) ||
        Boolean(cover.file) ||
        needsClear("AVATAR") ||
        needsClear("COVER")

    /** Runs the real clear + drops the image from the group header cache. */
    const clear = async (kind: GroupMediaKind) => {
        // hide it right away; a failed call leaves the picker empty, which is exactly
        // the "removal not saved yet" state the save button offers to retry
        pickerOf(kind).remove()
        const cleared = await runRest(() => clearGroupMedia(groupId, kind), {
            successMessage: t("identity.cleared"),
        })
        if (cleared === null) {
            return false
        }
        // The BE answers with the refreshed group, so patch the header cache straight
        // away (no refetch) — the avatar/cover must actually vanish from the chrome.
        await mutate(
            (current: GroupHeader | undefined) =>
                current
                    ? {
                        ...current,
                        ...(kind === "AVATAR"
                            ? { avatarUrl: null }
                            : { coverUrl: null }),
                    }
                    : current,
            { revalidate: false },
        )
        return true
    }

    // "Gỡ ảnh": unsaved pick → local drop; saved image → confirm, then the real DELETE.
    //
    // The local branch DISCARDS THE PICK ONLY (`discardPick`, not `remove`): dropping a
    // file the user picked by mistake must leave the saved image alone. `remove()` would
    // hide it too, which `needsClear()` reads as "removal pending" — the next Lưu would
    // then DELETE an image the user never asked to remove.
    const onRemove = (kind: GroupMediaKind) => {
        const picker = pickerOf(kind)
        if (picker.file !== null || savedUrlOf(kind) === null) {
            picker.discardPick()
            return
        }
        setPendingClear(kind)
    }

    const onConfirmClear = async () => {
        if (pendingClear === null || isClearing) {
            return
        }
        setIsClearing(true)
        await clear(pendingClear)
        setIsClearing(false)
        setPendingClear(null)
    }

    // Flush every pending change: a fresh file is uploaded, an image the user removed
    // while the server still holds it is cleared. Each step toasts its own failure
    // (see useMutateGroupMediaSwr / runRest).
    const onSave = async () => {
        if (isSaving || !hasPendingChange) {
            return
        }
        setIsSaving(true)
        for (const kind of MEDIA_KINDS) {
            const picker = pickerOf(kind)
            if (picker.file) {
                await runRest(() => upload(kind, picker.file as File), {
                    successMessage: t("identity.saved"),
                })
            } else if (needsClear(kind)) {
                await clear(kind)
            }
        }
        setIsSaving(false)
    }

    return (
        <div className="flex flex-col gap-3">
            <Typography type="h6" weight="bold">
                {t("identity.title")}
            </Typography>
            <GroupIdentityFields
                name={group?.name ?? ""}
                avatar={avatar}
                cover={cover}
                onRemove={onRemove}
                removingKind={isClearing ? pendingClear : null}
            />
            <Typography type="body-xs" color="muted">
                {t("identity.removeHint")}
            </Typography>
            <Button
                size="sm"
                variant="secondary"
                className="self-start"
                isDisabled={!hasPendingChange}
                isPending={isSaving}
                onPress={() => void onSave()}
            >
                {t("identity.save")}
            </Button>

            <ConfirmDialog
                isOpen={pendingClear !== null}
                onClose={() => {
                    if (!isClearing) {
                        setPendingClear(null)
                    }
                }}
                onConfirm={() => void onConfirmClear()}
                title={t("identity.clearConfirmTitle")}
                description={
                    pendingClear === "COVER"
                        ? t("identity.clearCoverConfirmDescription")
                        : t("identity.clearAvatarConfirmDescription")
                }
                confirmLabel={t("identity.remove")}
                isPending={isClearing}
            />
        </div>
    )
}
