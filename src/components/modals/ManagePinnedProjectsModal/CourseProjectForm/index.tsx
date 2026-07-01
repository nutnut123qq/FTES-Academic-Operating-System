"use client"

import React, { useState } from "react"
import {
    Button,
    Label,
    ListBox,
    Select,
    Spinner,
    TextArea,
    TextField,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import { CheckCircleIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { QUERY_USER_PINNED_PROJECTS_SWR } from "@/hooks/swr/api/graphql/queries/useQueryUserPinnedProjectsSwr"
import { useMutatePinCourseProjectSwr } from "@/hooks/swr/api/graphql/mutations/useMutatePinCourseProjectSwr"
import { useQueryMyPinnableCapstonesSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyPinnableCapstonesSwr"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { useGraphQLWithToast } from "@/modules/toast/hooks"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link CourseProjectForm}. */
export interface CourseProjectFormProps extends WithClassNames<undefined> {
    /** Called after a successful pin (close the modal / switch to the list). */
    onSuccess?: () => void
}

/**
 * Form for pinning one of the signed-in user's capstone projects. Loads the
 * pinnable capstones via {@link useQueryMyPinnableCapstonesSwr}, lets the user
 * pick one from a HeroUI Select (label = courseTitle + a verified chip when
 * {@link QueryMyPinnableCapstoneItemData.isVerified}), add an optional
 * description, then submits via {@link useMutatePinCourseProjectSwr} through
 * {@link useGraphQLWithToast}. On success: revalidates the viewer's
 * pinned-projects SWR key and calls `onSuccess`.
 *
 * @param props - {@link CourseProjectFormProps}
 */
export const CourseProjectForm = ({
    className,
    onSuccess,
}: CourseProjectFormProps) => {
    const t = useTranslations()
    const { mutate } = useSWRConfig()
    const runGraphQL = useGraphQLWithToast()

    // the signed-in viewer — needed to revalidate the correct SWR cache key
    const viewerId = useAppSelector((state) => state.user.user?.id)

    // load the user's pinnable capstones (enrollment rows that have a project repo)
    const { data: capstones, isLoading } = useQueryMyPinnableCapstonesSwr()
    const items = capstones ?? []

    // controlled selection: the enrollmentId of the chosen capstone, or null
    const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null)
    // optional description the user types in
    const [description, setDescription] = useState("")
    // in-flight submit guard
    const [isSubmitting, setIsSubmitting] = useState(false)

    // the SWR mutation that calls pinCourseProject on the backend
    const pinSwr = useMutatePinCourseProjectSwr()

    /** Submit the pin mutation and revalidate on success. */
    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        // prevent native form navigation
        e.preventDefault()
        // require a capstone to be selected before submitting
        if (!selectedEnrollmentId) return

        setIsSubmitting(true)
        await runGraphQL(
            async () => {
                // call the pinCourseProject GraphQL mutation
                const result = await pinSwr.trigger({
                    enrollmentId: selectedEnrollmentId,
                    description: description.trim() || undefined,
                })
                const env = result?.data?.pinCourseProject
                if (!env) {
                    throw new Error(t("toast.defaultError"))
                }
                // on success: revalidate the owner's pinned list, reset state, close
                if (env.success) {
                    if (viewerId) {
                        // bust the viewer's cached pinned-projects list
                        await mutate([QUERY_USER_PINNED_PROJECTS_SWR, viewerId])
                    }
                    // reset form state to blank
                    setSelectedEnrollmentId(null)
                    setDescription("")
                    onSuccess?.()
                }
                return env
            },
            {
                showErrorToast: true,
                showSuccessToast: true,
            },
        )
        setIsSubmitting(false)
    }

    return (
        <form
            className={className}
            onSubmit={onSubmit}
        >
            <div className="flex flex-col gap-3">
                {/* capstone picker — shows all enrollments that have a project repo */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="course-pin-select">
                        {t("pinnedProjects.course.selectLabel")}
                    </Label>
                    {/* HeroUI Select compound: Root wraps trigger + popover */}
                    <Select.Root<{ id: string }, "single">
                        id="course-pin-select"
                        aria-label={t("pinnedProjects.course.selectLabel")}
                        isDisabled={isLoading || isSubmitting}
                        selectedKey={selectedEnrollmentId ?? undefined}
                        onSelectionChange={(key) => setSelectedEnrollmentId(key ? String(key) : null)}
                    >
                        {/* trigger button shows the currently selected course title */}
                        <Select.Trigger aria-label={t("pinnedProjects.course.selectLabel")}>
                            <Select.Value>
                                {() => {
                                    // resolve the display label from local state (selectedEnrollmentId)
                                    const found = items.find(
                                        (item) => item.enrollmentId === selectedEnrollmentId,
                                    )
                                    return found ? (
                                        <span>{found.courseTitle}</span>
                                    ) : (
                                        <Typography type="body-sm" color="muted">
                                            {isLoading
                                                ? t("pinnedProjects.course.loading")
                                                : t("pinnedProjects.course.selectPlaceholder")}
                                        </Typography>
                                    )
                                }}
                            </Select.Value>
                            <Select.Indicator />
                        </Select.Trigger>
                        {/* popover listing each pinnable capstone */}
                        <Select.Popover>
                            <ListBox.Root
                                aria-label={t("pinnedProjects.course.selectLabel")}
                                items={items.map((item) => ({ id: item.enrollmentId, ...item }))}
                            >
                                {(item) => (
                                    // each item: course title + verified chip when applicable
                                    <ListBox.Item
                                        key={item.enrollmentId}
                                        id={item.enrollmentId}
                                        textValue={item.courseTitle}
                                        aria-label={item.courseTitle}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{item.courseTitle}</span>
                                            {/* only show the verified chip when the capstone is graded */}
                                            {item.isVerified ? (
                                                <StatusChip
                                                    tone="success"
                                                    icon={<CheckCircleIcon />}
                                                >
                                                    {t("pinnedProjects.course.verified")}
                                                </StatusChip>
                                            ) : null}
                                        </div>
                                    </ListBox.Item>
                                )}
                            </ListBox.Root>
                        </Select.Popover>
                    </Select.Root>

                    {/* empty state: user has no pinnable capstones at all */}
                    {!isLoading && items.length === 0 ? (
                        <Typography type="body-xs" color="muted">
                            {t("pinnedProjects.course.noCourses")}
                        </Typography>
                    ) : null}
                </div>

                {/* optional description — TextField+TextArea (same skin as the other fields) */}
                <TextField variant="secondary" isDisabled={isSubmitting}>
                    <Label htmlFor="course-pin-description">
                        {t("pinnedProjects.form.description")}
                    </Label>
                    <TextArea
                        id="course-pin-description"
                        rows={3}
                        placeholder={t("pinnedProjects.form.descriptionPlaceholder")}
                        aria-label={t("pinnedProjects.form.description")}
                        className="resize-none"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </TextField>

                {/* submit button — disabled + pending while the mutation is in flight */}
                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isDisabled={!selectedEnrollmentId || isSubmitting}
                    isPending={isSubmitting}
                >
                    {({ isPending }) => (
                        <>
                            {isPending ? (
                                <Spinner color="current" size="sm" />
                            ) : null}
                            {t("pinnedProjects.form.submit")}
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
