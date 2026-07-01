"use client"

import React, { useMemo } from "react"
import {
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownTrigger,
    Label,
    Modal,
    Typography,
    cn,
} from "@heroui/react"
import { CaretDownIcon, SparkleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { AiModelCategory } from "@/modules/api/graphql/queries/query-ai-models"
import {
    useContentAiSelectedModel,
    useContentAiSettingsOverlayState,
} from "@/hooks/zustand/overlay/hooks"
import { useQueryAiModelsSwr } from "@/hooks/swr/api/graphql/queries/useQueryAiModelsSwr"
import { AiCategoryChip } from "@/components/blocks/chips/AiCategoryChip"

/**
 * Content-AI chat settings modal — the model picker (free tier). Opened from the
 * ask-AI chat composer's gear button; mounted once by
 * {@link import("../ModalContainer").ModalContainer}. The selected model is shared
 * with the chat composer via the overlay store. (Deleting a conversation lives in
 * the chat's conversations drawer, per-session — not here.)
 *
 * @param props - {@link WithClassNames}.
 */
export const ContentAiSettingsModal = ({ className }: WithClassNames<undefined>) => {
    const t = useTranslations()
    const { isOpen, setOpen } = useContentAiSettingsOverlayState()
    const { selectedModel, setSelectedModel } = useContentAiSelectedModel()

    // free models only — content-AI tutoring runs on the 0-credit local tier
    const aiModelsSwr = useQueryAiModelsSwr()
    const freeModels = useMemo(
        () => (aiModelsSwr.data?.aiModels?.data?.gradableModels ?? [])
            .filter((model) => model.category === AiModelCategory.Free && model.available),
        [aiModelsSwr.data],
    )
    const activeModelLabel = selectedModel ?? freeModels[0]?.model ?? "—"

    return (
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
            {/* z-[70] so it sits above the chat popover (FAB is z-40) it opens from */}
            <Modal.Backdrop className={cn("z-[70]", className)}>
                <Modal.Container size="xs">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Typography type="body" weight="semibold" className="pr-8">
                                {t("contentAi.settings")}
                            </Typography>
                        </Modal.Header>
                        <Modal.Body>
                            {/* model picker — same dropdown as the composer */}
                            <div className="flex flex-col gap-2">
                                <Label>{t("contentAi.modelLabel")}</Label>
                                <Dropdown>
                                    <DropdownTrigger className="cursor-pointer">
                                        <div className="flex items-center justify-between gap-2 rounded-xl bg-default px-3 py-2">
                                            <span className="flex min-w-0 items-center gap-2">
                                                <SparkleIcon className="size-5 shrink-0" />
                                                <Typography type="body-sm" truncate>
                                                    {activeModelLabel}
                                                </Typography>
                                            </span>
                                            <span className="flex shrink-0 items-center gap-2">
                                                <AiCategoryChip category={AiModelCategory.Free} />
                                                <CaretDownIcon className="size-4" />
                                            </span>
                                        </div>
                                    </DropdownTrigger>
                                    <DropdownPopover className="min-w-56">
                                        <DropdownMenu aria-label={t("contentAi.pickModel")}>
                                            {freeModels.map((model) => (
                                                <DropdownItem
                                                    key={`${model.provider}:${model.model}`}
                                                    textValue={model.model}
                                                    onPress={() => setSelectedModel(model.model)}
                                                >
                                                    <div className="flex w-full items-center justify-between gap-2">
                                                        <span className="truncate">{model.model}</span>
                                                        <AiCategoryChip category={model.category} />
                                                    </div>
                                                </DropdownItem>
                                            ))}
                                        </DropdownMenu>
                                    </DropdownPopover>
                                </Dropdown>
                            </div>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
