"use client"

import React, { useState } from "react"
import { Button, Dropdown, Label, Modal, Typography, toast } from "@heroui/react"
import { DotsThreeIcon, ProhibitIcon, UserSwitchIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { KeyedMutator } from "swr"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { usePostBanSubjectMemberSwr } from "@/hooks/swr/api/rest/mutations/usePostBanSubjectMemberSwr"
import { usePostChangeSubjectMemberRoleSwr } from "@/hooks/swr/api/rest/mutations/usePostChangeSubjectMemberRoleSwr"
import { RestError } from "@/modules/api/rest/client"
import type {
    MemberRole,
    SubjectMember,
} from "../hooks/useQuerySubjectMembersSwr"
import type { SubjectMembershipRole } from "./useQuerySubjectCallerMembershipSwr"

/** Assignable roles, in escalation order. `be` is the value the BE enum accepts. */
const ROLE_OPTIONS: Array<{ be: SubjectMembershipRole; facet: MemberRole }> = [
    { be: "STUDENT", facet: "student" },
    { be: "CONTRIBUTOR", facet: "contributor" },
    { be: "MODERATOR", facet: "moderator" },
    { be: "LECTURER", facet: "lecturer" },
]

/** Props for {@link MemberActionsMenu}. */
export interface MemberActionsMenuProps {
    /** Subject code the member belongs to (`PRF192`). */
    code: string
    /** The row this menu acts on. */
    member: SubjectMember
    /** Bound SWR mutator of the member list (optimistic write + rollback). */
    mutate: KeyedMutator<Array<SubjectMember>>
}

/**
 * Per-row moderation menu of the Members tab (§3): change a member's role
 * (`PUT /subjects/{code}/members/{userId}/role`) or ban them
 * (`POST /subjects/{code}/members/{userId}/ban`, behind a confirm step).
 *
 * The caller-side gate lives in the tab (only MODERATOR/LECTURER render this);
 * the BE re-checks (`subject.manage` / subject moderator) and a 403 surfaces as a
 * toast. Both writes are optimistic on the member list and roll back on failure.
 */
export const MemberActionsMenu = ({ code, member, mutate }: MemberActionsMenuProps) => {
    const t = useTranslations("subjects")
    const tCommon = useTranslations("common")
    const { requireAuth } = useRequireAuth()
    const changeRole = usePostChangeSubjectMemberRoleSwr()
    const banMember = usePostBanSubjectMemberSwr()
    const [confirmingBan, setConfirmingBan] = useState(false)

    /** Maps an API failure to a toast; 401 re-opens the sign-in modal instead. */
    const reportError = (error: unknown, fallbackKey: string) => {
        if (error instanceof RestError) {
            if (error.status === 401) {
                requireAuth("auth.context.generic")
                return
            }
            if (error.status === 403) {
                toast.danger(t("members.actionForbidden"))
                return
            }
            if (error.status === 404) {
                toast.danger(t("members.actionNotFound"))
                return
            }
            if (error.status === 429) {
                toast.danger(t("members.actionRateLimited"))
                return
            }
        }
        toast.danger(t(fallbackKey))
    }

    const onChangeRole = async (option: (typeof ROLE_OPTIONS)[number]) => {
        const next = (current: Array<SubjectMember> | undefined) =>
            (current ?? []).map((row) =>
                row.id === member.id ? { ...row, role: option.facet } : row,
            )
        try {
            await mutate(
                async (current) => {
                    await changeRole.trigger({
                        code,
                        userId: member.id,
                        request: { role: option.be },
                    })
                    return next(current)
                },
                { optimisticData: next, rollbackOnError: true, revalidate: true },
            )
            toast.success(t("members.roleChanged", { role: t(`members.roles.${option.facet}`) }))
        } catch (error) {
            reportError(error, "members.roleChangeError")
        }
    }

    const onBan = async () => {
        const next = (current: Array<SubjectMember> | undefined) =>
            (current ?? []).filter((row) => row.id !== member.id)
        try {
            await mutate(
                async (current) => {
                    await banMember.trigger({ code, userId: member.id })
                    return next(current)
                },
                { optimisticData: next, rollbackOnError: true, revalidate: true },
            )
            setConfirmingBan(false)
            toast.success(t("members.banned"))
        } catch (error) {
            setConfirmingBan(false)
            reportError(error, "members.banError")
        }
    }

    const isBusy = changeRole.isMutating || banMember.isMutating

    return (
        <>
            <Dropdown>
                <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={t("members.manage")}
                    isDisabled={isBusy}
                >
                    <DotsThreeIcon aria-hidden focusable="false" className="size-5" weight="bold" />
                </Button>
                <Dropdown.Popover>
                    <Dropdown.Menu aria-label={t("members.manage")}>
                        <Dropdown.Section>
                            {ROLE_OPTIONS.filter((option) => option.facet !== member.role).map(
                                (option) => {
                                    const label = t("members.setRole", {
                                        role: t(`members.roles.${option.facet}`),
                                    })
                                    return (
                                        // react-aria needs a real `id` (not just the React key)
                                        <Dropdown.Item
                                            key={option.be}
                                            id={option.be}
                                            textValue={label}
                                            onPress={() => { void onChangeRole(option) }}
                                        >
                                            <UserSwitchIcon aria-hidden focusable="false" className="size-5" />
                                            <Label>{label}</Label>
                                        </Dropdown.Item>
                                    )
                                },
                            )}
                        </Dropdown.Section>
                        <Dropdown.Section>
                            <Dropdown.Item
                                key="ban"
                                id="ban"
                                textValue={t("members.ban")}
                                onPress={() => setConfirmingBan(true)}
                            >
                                <ProhibitIcon aria-hidden focusable="false" className="size-5" />
                                <Label>{t("members.ban")}</Label>
                            </Dropdown.Item>
                        </Dropdown.Section>
                    </Dropdown.Menu>
                </Dropdown.Popover>
            </Dropdown>

            {/* ban confirmation — destructive, never one-click from the menu */}
            <Modal
                isOpen={confirmingBan}
                onOpenChange={(open) => {
                    if (!open) {
                        setConfirmingBan(false)
                    }
                }}
            >
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog className="w-full max-w-md">
                            <Modal.Header>
                                <Typography type="body" weight="bold">
                                    {t("members.banConfirmTitle")}
                                </Typography>
                            </Modal.Header>
                            <Modal.Body>
                                <Typography type="body-sm" color="muted">
                                    {t("members.banConfirmBody", { name: member.name })}
                                </Typography>
                            </Modal.Body>
                            <Modal.Footer className="justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    onPress={() => setConfirmingBan(false)}
                                    isDisabled={banMember.isMutating}
                                >
                                    {tCommon("cancel")}
                                </Button>
                                <Button
                                    variant="danger"
                                    onPress={() => { void onBan() }}
                                    isPending={banMember.isMutating}
                                >
                                    {t("members.ban")}
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </>
    )
}
