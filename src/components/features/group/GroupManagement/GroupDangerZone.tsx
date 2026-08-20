"use client"

import React, { useState } from "react"
import { Button, Modal, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import { useRestWithToast } from "@/modules/toast/hooks"
import { usePostArchiveGroupSwr } from "@/hooks/swr/api/rest/mutations/usePostArchiveGroupSwr"
import { usePostTransferGroupOwnershipSwr } from "@/hooks/swr/api/rest/mutations/usePostTransferGroupOwnershipSwr"
import { ConfirmDialog } from "@/components/reuseable/PostEngagementBar"
import { groupHeaderKey } from "../hooks/useQueryGroupSwr"
import { useQueryGroupMemberRowsSwr } from "../GroupMembers/useQueryGroupMemberRowsSwr"
import { groupSettingsKey } from "./useQueryGroupSettingsSwr"

/** Props for {@link GroupDangerZone}. */
export interface GroupDangerZoneProps {
    /** Group being managed. */
    groupId: string
    /** Group name — typed back by the user to unlock the archive action. */
    groupName: string
    /** Whether the viewer owns the group; both actions are OWNER-only server-side. */
    isOwner: boolean
    /** Whether the group is already archived (archiving again is a no-op). */
    isArchived: boolean
}

/**
 * Danger zone of the management tab: archive the group and transfer ownership.
 * Both are OWNER-only on the backend (`GroupService.archive` /
 * `MembershipService.transferOwnership`), so the whole section is hidden for a
 * plain admin rather than offering actions that would 403.
 *
 * Two backend rules shape the UI:
 *  - the new owner MUST already be an ADMIN of the group
 *    (`GROUP_NEW_OWNER_NOT_ADMIN`), so the picker lists admins only and explains
 *    what to do when there is none;
 *  - archiving is irreversible from this surface, so it is gated behind typing the
 *    group name back — a plain "are you sure" is too easy to click through.
 *
 * @param props - {@link GroupDangerZoneProps}
 */
export const GroupDangerZone = ({
    groupId,
    groupName,
    isOwner,
    isArchived,
}: GroupDangerZoneProps) => {
    const t = useTranslations("groupsHub")
    const runRest = useRestWithToast()
    const { mutate: globalMutate } = useSWRConfig()
    const { members, mutate: mutateMembers } = useQueryGroupMemberRowsSwr(groupId)
    const { trigger: archive, isMutating: isArchiving } = usePostArchiveGroupSwr()
    const { trigger: transfer, isMutating: isTransferring } =
        usePostTransferGroupOwnershipSwr()
    const [newOwnerId, setNewOwnerId] = useState("")
    const [isTransferConfirmOpen, setTransferConfirmOpen] = useState(false)
    const [isArchiveOpen, setArchiveOpen] = useState(false)
    const [archiveInput, setArchiveInput] = useState("")

    if (!isOwner) {
        return null
    }

    // only a current ADMIN may receive ownership (BE invariant)
    const candidates = members.filter((member) => member.role === "admin")
    const selected = candidates.find((member) => member.id === newOwnerId) ?? null
    const canArchive = archiveInput.trim() === groupName.trim() && groupName.trim() !== ""

    const onConfirmTransfer = async () => {
        if (!selected || isTransferring) {
            return
        }
        const ok = await runRest(
            () => transfer({ id: groupId, request: { newOwnerId: selected.id } }),
            { successMessage: t("manage.transferred") },
        )
        setTransferConfirmOpen(false)
        if (ok !== null) {
            setNewOwnerId("")
            await mutateMembers()
            await globalMutate(groupSettingsKey(groupId))
            await globalMutate(groupHeaderKey(groupId))
        }
    }

    const onConfirmArchive = async () => {
        if (!canArchive || isArchiving) {
            return
        }
        const ok = await runRest(() => archive(groupId), {
            successMessage: t("manage.archived"),
        })
        setArchiveOpen(false)
        setArchiveInput("")
        if (ok !== null) {
            await globalMutate(groupSettingsKey(groupId))
            await globalMutate(groupHeaderKey(groupId))
        }
    }

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-danger/40 p-4">
            <Typography type="h6" weight="bold" className="text-danger">
                {t("manage.dangerZone")}
            </Typography>

            {/* transfer ownership — admin picker + confirm */}
            <div className="flex flex-col gap-2">
                <Typography type="body-sm" weight="medium">
                    {t("manage.transfer")}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("manage.transferHint")}
                </Typography>
                {candidates.length === 0 ? (
                    <Typography type="body-xs" color="muted">
                        {t("manage.transferNoAdmins")}
                    </Typography>
                ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        {/* `[&>option]:bg-surface [&>option]:text-foreground` — xem giải thích
                            đầy đủ ở GroupCreate: select `bg-transparent` khiến popup native của
                            Chromium rơi về nền trắng, còn <option> kế thừa `--foreground` trắng
                            ⇒ dark mode không đọc được dòng nào trừ dòng đang rê chuột. Sơn nền
                            đục THẲNG lên <option> là chỗ DUY NHẤT popup của Blink còn nghe theo. */}
                        <select
                            value={newOwnerId}
                            aria-label={t("manage.transferSelect")}
                            onChange={(event) => setNewOwnerId(event.target.value)}
                            className="w-full min-w-0 flex-1 rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none focus:border-accent [&>option]:bg-surface [&>option]:text-foreground"
                        >
                            <option value="">{t("manage.transferSelect")}</option>
                            {candidates.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.displayName ?? member.username ?? member.id}
                                </option>
                            ))}
                        </select>
                        <Button
                            size="sm"
                            variant="danger"
                            className="shrink-0"
                            isDisabled={selected === null}
                            isPending={isTransferring}
                            onPress={() => setTransferConfirmOpen(true)}
                        >
                            {t("manage.transferAction")}
                        </Button>
                    </div>
                )}
            </div>

            {/* archive — strong confirm (type the group name back) */}
            <div className="flex flex-col gap-2 border-t border-separator pt-4">
                <Typography type="body-sm" weight="medium">
                    {t("manage.archive")}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t("manage.archiveHint")}
                </Typography>
                <Button
                    size="sm"
                    variant="danger"
                    className="self-start"
                    isDisabled={isArchived}
                    onPress={() => setArchiveOpen(true)}
                >
                    {isArchived ? t("manage.archivedAlready") : t("manage.archive")}
                </Button>
            </div>

            <ConfirmDialog
                isOpen={isTransferConfirmOpen}
                onClose={() => setTransferConfirmOpen(false)}
                onConfirm={() => void onConfirmTransfer()}
                title={t("manage.transferConfirmTitle")}
                description={t("manage.transferConfirmDescription", {
                    name: selected?.displayName ?? selected?.username ?? selected?.id ?? "",
                })}
                confirmLabel={t("manage.transferAction")}
                isPending={isTransferring}
            />

            <Modal
                isOpen={isArchiveOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setArchiveOpen(false)
                        setArchiveInput("")
                    }
                }}
            >
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog className="w-full max-w-md">
                            <Modal.Header>
                                <Typography type="body" weight="bold">
                                    {t("manage.archiveConfirmTitle")}
                                </Typography>
                            </Modal.Header>
                            <Modal.Body className="flex flex-col gap-3">
                                <Typography type="body-sm" color="muted">
                                    {t("manage.archiveConfirmDescription")}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {t("manage.archiveTypeName", { name: groupName })}
                                </Typography>
                                <input
                                    value={archiveInput}
                                    aria-label={t("manage.archiveTypeName", { name: groupName })}
                                    onChange={(event) => setArchiveInput(event.target.value)}
                                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none focus:border-danger"
                                />
                            </Modal.Body>
                            <Modal.Footer className="justify-end gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    isDisabled={isArchiving}
                                    onPress={() => {
                                        setArchiveOpen(false)
                                        setArchiveInput("")
                                    }}
                                >
                                    {t("manage.cancel")}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="danger"
                                    isDisabled={!canArchive}
                                    isPending={isArchiving}
                                    onPress={() => void onConfirmArchive()}
                                >
                                    {t("manage.archiveConfirm")}
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </div>
    )
}
