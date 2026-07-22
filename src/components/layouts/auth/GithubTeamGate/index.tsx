"use client"

import React, { useCallback, useState } from "react"
import { useParams } from "next/navigation"
import { Alert, Button, Modal, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { GraduationCapIcon } from "@phosphor-icons/react"
import { useAppSelector } from "@/redux/hooks"
import { useQueryMyGithubTeamStatusSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyGithubTeamStatusSwr"
import { useLinkGithubOverlayState } from "@/hooks/zustand/overlay/hooks"
import { IconTile } from "@/components/blocks/identity/IconTile"
import { mutateRequestToTeam } from "@/modules/api/graphql/mutations/mutation-request-to-team"
import { GithubIcon } from "@/components/svg/GithubIcon"

/**
 * Course GitHub-team join — NON-BLOCKING.
 *
 * A PAID-enrolled learner (the backend scopes teams to `is_enrolled = true`, so
 * trial viewers never see this) who is not yet in their course GitHub team gets a
 * persistent warning banner on the learn page (the learn page stays fully usable
 * — you just can't reach GitHub: challenges + the personal-project repo). The
 * banner opens an opt-in, DISMISSABLE modal with the step-by-step join flow:
 * link GitHub (if needed) → request to join → accept the invite on GitHub →
 * re-check. The banner clears the moment every required team flips to `active`.
 */
export const GithubTeamGate = () => {
    const t = useTranslations()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    // current course cover for the modal identity tile (mirrors the enroll modal summary)
    const coverImageUrl = useAppSelector((state) => state.course.entity?.coverImageUrl)
    const { data, mutate, isLoading } = useQueryMyGithubTeamStatusSwr()
    const { setOpen: setLinkGithubOpen } = useLinkGithubOverlayState()
    const [requesting, setRequesting] = useState(false)
    // the guided modal is opt-in (opened from the banner CTA) and dismissable
    const [modalOpen, setModalOpen] = useState(false)

    // scope to the COURSE CURRENTLY BEING STUDIED (route segment [courseId] = slug).
    const params = useParams()
    const courseSlug = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId
    const courseTeams = (data?.teams ?? []).filter((entry) => entry.courseSlug === courseSlug)
    const allInCourseTeams = courseTeams.every((entry) => entry.state === "active")

    // request to join THIS course's team if not invited yet (non-blocking enqueue;
    // job settlement is observed via the refetch below + the "re-check" button — no
    // realtime push, the legacy socket.io job channel had no server and was removed,
    // so nothing must gate the UI on a job status that can never arrive).
    const onRequest = useCallback(
        async () => {
            setRequesting(true)
            try {
                for (const team of courseTeams.filter((entry) => entry.state === "none")) {
                    await mutateRequestToTeam({
                        request: {
                            courseId: team.courseId,
                        },
                    })
                }
                // refetch once so a row the BE already flipped (none → pending) updates;
                // if the async invite job hasn't landed yet, "re-check" covers it later
                await mutate()
            } finally {
                setRequesting(false)
            }
        },
        [courseTeams, mutate],
    )

    // show only for a viewer with a (paid) team for THIS course that isn't fully joined
    const open = Boolean(
        authenticated && data && courseTeams.length > 0 && !allInCourseTeams,
    )
    if (!open || !data) {
        return null
    }

    const linked = data.linked
    const hasUninvited = courseTeams.some((entry) => entry.state === "none")

    // identity-tile state line (this course's team; gate is scoped to the current course)
    const primaryTeam = courseTeams[0]
    const primaryState = primaryTeam?.state ?? "none"
    const primaryStateLabel = requesting
        ? t("githubTeamGate.sending")
        : t(`githubTeamGate.state.${primaryState}`)
    const primaryStateColor = requesting || primaryState === "pending"
        ? "text-warning"
        : primaryState === "active"
            ? "text-success"
            : "text-muted"

    /** Leading step number badge. */
    const stepBadge = (n: number) => (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
            {n}
        </span>
    )

    return (
        <>
            {/* persistent, non-blocking warning on the learn page */}
            <Alert status="warning" className="bg-warning/10 shadow-none">
                <Alert.Indicator>
                    <GithubIcon className="size-5" />
                </Alert.Indicator>
                <Alert.Content className="gap-0">
                    <Alert.Title>{t("githubTeamGate.warningTitle")}</Alert.Title>
                    <Alert.Description>{t("githubTeamGate.warningBody")}</Alert.Description>
                </Alert.Content>
                <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="ml-auto shrink-0 rounded-full bg-warning px-4 py-1.5 text-sm font-medium text-warning-foreground transition-opacity hover:opacity-90">
                    {t("githubTeamGate.openCta")}
                </button>
            </Alert>

            {/* opt-in, DISMISSABLE guided modal */}
            <Modal isOpen={modalOpen} onOpenChange={setModalOpen}>
                <Modal.Backdrop>
                    <Modal.Container size="sm">
                        <Modal.Dialog>
                            <Modal.CloseTrigger />
                            <Modal.Header>
                                <Typography type="body" weight="semibold" className="pr-8">
                                    {t("githubTeamGate.title")}
                                </Typography>
                            </Modal.Header>
                            <Modal.Body className="flex flex-col gap-4 pb-6">
                                {!linked ? (
                                    <>
                                        <p className="text-sm text-muted">
                                            {t("githubTeamGate.linkFirst")}
                                        </p>
                                        <Button
                                            variant="primary"
                                            className="self-start"
                                            onPress={() => {
                                                // avoid stacking on the link modal it opens
                                                setModalOpen(false)
                                                setLinkGithubOpen(true)
                                            }}>
                                            <GithubIcon className="size-4" />
                                            {t("githubTeamGate.linkCta")}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {/* course identity (FLAT — mirrors the enroll modal summary):
                                            cover IconTile + course title + team state */}
                                        <div className="flex items-center gap-3">
                                            <IconTile
                                                size="sm"
                                                src={coverImageUrl ?? undefined}
                                                icon={<GraduationCapIcon aria-hidden focusable="false" />}
                                            />
                                            <div className="flex min-w-0 flex-col">
                                                <Typography type="body-sm" weight="semibold" truncate>
                                                    {primaryTeam?.courseTitle}
                                                </Typography>
                                                <span className={cn("text-xs", primaryStateColor)}>
                                                    {primaryStateLabel}
                                                </span>
                                            </div>
                                        </div>

                                        {/* step-by-step join flow */}
                                        <ol className="flex flex-col gap-3">
                                            <li className="flex gap-3">
                                                {stepBadge(1)}
                                                <div className="flex min-w-0 flex-1 flex-col gap-2">
                                                    <p className="text-sm">{t("githubTeamGate.step1")}</p>
                                                    {hasUninvited ? (
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            className="self-start"
                                                            isDisabled={requesting}
                                                            onPress={onRequest}>
                                                            {requesting
                                                                ? t("githubTeamGate.sending")
                                                                : t("githubTeamGate.requestCta")}
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </li>
                                            <li className="flex gap-3">
                                                {stepBadge(2)}
                                                <p className="min-w-0 flex-1 text-sm">{t("githubTeamGate.step2")}</p>
                                            </li>
                                            <li className="flex gap-3">
                                                {stepBadge(3)}
                                                <div className="flex min-w-0 flex-1 flex-col gap-2">
                                                    <p className="text-sm">{t("githubTeamGate.step3")}</p>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="self-start"
                                                        isDisabled={isLoading}
                                                        onPress={() => mutate()}>
                                                        {t("githubTeamGate.recheckCta")}
                                                    </Button>
                                                </div>
                                            </li>
                                        </ol>
                                    </>
                                )}
                            </Modal.Body>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </>
    )
}
