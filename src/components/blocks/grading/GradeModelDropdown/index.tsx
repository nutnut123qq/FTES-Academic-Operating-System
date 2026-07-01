"use client"

import { CaretDownIcon, LockIcon, SparkleIcon, WarningCircleIcon, WarningIcon } from "@phosphor-icons/react"
import React from "react"
import {
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownPopover,
    DropdownSection,
    DropdownTrigger,
    Tooltip,
    Typography,
    cn
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import { AiMode } from "@/modules/api/graphql/queries/query-my-ai-settings"
import type { ModelProvider } from "@/modules/api/graphql/queries/query-my-ai-settings"
import { AiModelCategory } from "@/modules/api/graphql/queries/query-ai-models"
import { type AiGradableModel } from "@/modules/api/graphql/queries/types/ai-models"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { AiCategoryChip } from "@/components/blocks/chips/AiCategoryChip"

/**
 * Lane + model selection emitted by the picker. `model`/`provider` null = the
 * Auto lane (the balancer picks). Structurally matches feature selection types
 * (e.g. ChallengeGradeSelection) so callers pass theirs directly.
 */
export interface GradeModelSelection {
    /** Lane to run on (Auto = balancer-picked, Premium = pinned model). */
    mode: AiMode
    /** Pinned model name, or null for the Auto lane. */
    model: string | null
    /** Provider of the pinned model, or null for the Auto lane. */
    provider: ModelProvider | null
}

/** Categories that need an unlock (paid OR enrolled) to pick. */
const PLAN_CATEGORIES: ReadonlyArray<AiModelCategory> = [
    AiModelCategory.Balanced,
    AiModelCategory.Premium,
    AiModelCategory.Frontier,
]

/** Category ladder cheapest → strongest — for "below the floor" comparison. */
const CATEGORY_ORDER: ReadonlyArray<AiModelCategory> = [
    AiModelCategory.Free,
    AiModelCategory.Economy,
    AiModelCategory.Balanced,
    AiModelCategory.Premium,
    AiModelCategory.Frontier,
]

/** Props for {@link GradeModelDropdown}. */
export type GradeModelDropdownProps = WithClassNames<undefined> & {
    /** Enabled models the user can pick from (from the `aiModels` catalog). */
    models: Array<AiGradableModel>
    /** The current lane + model selection. */
    selection: GradeModelSelection
    /**
     * Whether higher-tier models are unlocked for this user (paid OR enrolled —
     * the FTES AOS rule). Drives the lock on Balanced / Premium / Frontier.
     */
    canPremium: boolean
    /** Disables the whole control (e.g. while a grade is in flight). */
    isDisabled?: boolean
    /**
     * Show the "Auto" lane entry on top. Default true. Pass false where a concrete
     * model is required (e.g. personal-project review must pin a model).
     */
    showAutoLane?: boolean
    /**
     * Recommended minimum category. Any model BELOW it is flagged WARNING (still
     * selectable, but may be inaccurate). Grading passes `Economy` → Free models
     * read a warning; the lesson chatbot omits it (Free is its normal lane).
     */
    floor?: AiModelCategory
    /** Popover placement. Default "bottom start"; pass "top start" for a bottom-anchored composer. */
    placement?: "bottom start" | "top start"
    /** Fired with the new selection when the user picks an option. */
    onSelect: (selection: GradeModelSelection) => void
    /** Fired when a locked (unlock-required) model is pressed — route to plans. */
    onUpgrade: () => void
}

/**
 * Shared lane + model picker (grading, AI lab, any model-select surface).
 *
 * Renders the "Auto" lane plus every catalog model (tagged with its cost
 * category chip). Per model:
 * - no working key → DISABLED (warning, not selectable).
 * - Balanced / Premium / Frontier without an unlock → LOCKED (routes to plans).
 * - below the `floor` → SELECTABLE but flagged WARNING (may be inaccurate).
 * - otherwise → normal selectable.
 *
 * @param props - {@link GradeModelDropdownProps}
 */
export const GradeModelDropdown = ({
    models,
    selection,
    canPremium,
    isDisabled = false,
    showAutoLane = true,
    floor,
    placement = "bottom start",
    onSelect,
    onUpgrade,
    className,
}: GradeModelDropdownProps) => {
    const t = useTranslations()
    // a pinned model shows its name; otherwise the Auto label (or "pick a model"
    // when the Auto lane is hidden and nothing is picked yet)
    const triggerLabel = selection.model
        ?? (showAutoLane ? t("aiSettings.lanes.auto.title") : t("aiSettings.pickModel"))

    return (
        <Dropdown>
            <DropdownTrigger
                isDisabled={isDisabled}
                className={cn("cursor-pointer", className)}
            >
                <div className="flex items-center gap-2">
                    <SparkleIcon className="size-5" />
                    <span className="max-w-40 truncate">{triggerLabel}</span>
                    <CaretDownIcon className="size-5" />
                </div>
            </DropdownTrigger>
            <DropdownPopover
                placement={placement}
                className="min-w-64"
            >
                <DropdownMenu
                    aria-label={t("aiSettings.pickModel")}
                >
                    {/* Auto lane — balancer picks a model on the floor→climb chain */}
                    {showAutoLane ? (
                        <DropdownSection>
                            <DropdownItem
                                key="auto"
                                onPress={() => onSelect({
                                    mode: AiMode.Auto,
                                    model: null,
                                    provider: null,
                                })}
                            >
                                <div className="flex items-center gap-2">
                                    <span>{t("aiSettings.lanes.auto.title")}</span>
                                </div>
                            </DropdownItem>
                        </DropdownSection>
                    ) : null}
                    {/* One entry per catalog model. Below-floor = warning (selectable,
                        risky); Balanced/Premium/Frontier = locked without an unlock. */}
                    <DropdownSection className={showAutoLane ? "border-t border-divider pt-1 mt-1" : undefined}>
                        {models.map((model) => {
                            const key = `${model.provider}:${model.model}`
                            const categoryChip = <AiCategoryChip category={model.category} />
                            const requiresPlan = PLAN_CATEGORIES.includes(model.category)
                            // below the recommended floor → flag danger (grading: Free is
                            // below Economy). No floor → never flagged (chatbot runs Free).
                            const belowFloor = floor !== undefined
                                && CATEGORY_ORDER.indexOf(model.category) < CATEGORY_ORDER.indexOf(floor)
                            if (!model.available) {
                                // DISABLED (not locked): model/provider tạm không khả dụng
                                // (key không hợp lệ / provider down) → icon CẢNH BÁO.
                                return (
                                    <DropdownItem
                                        key={key}
                                        textValue={model.model}
                                        onPress={() => undefined}
                                    >
                                        <Tooltip>
                                            <Tooltip.Trigger>
                                                <div className="flex w-full items-center justify-between gap-2 text-muted">
                                                    <span className="flex min-w-0 items-center gap-2">
                                                        <WarningCircleIcon className="size-5 shrink-0" />
                                                        <span className="truncate">{model.model}</span>
                                                    </span>
                                                    {categoryChip}
                                                </div>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content>{t("aiSettings.modelUnavailable")}</Tooltip.Content>
                                        </Tooltip>
                                    </DropdownItem>
                                )
                            }
                            if (requiresPlan && !canPremium) {
                                // LOCKED: cần nâng gói HOẶC enroll khoá để mở tier cao.
                                return (
                                    <DropdownItem
                                        key={key}
                                        textValue={model.model}
                                        onPress={onUpgrade}
                                    >
                                        <Tooltip>
                                            <Tooltip.Trigger>
                                                <div className="flex w-full items-center justify-between gap-2 text-muted">
                                                    <span className="flex min-w-0 items-center gap-2">
                                                        <LockIcon className="size-5 shrink-0" />
                                                        <span className="truncate">{model.model}</span>
                                                    </span>
                                                    {categoryChip}
                                                </div>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content>
                                                <Typography type="body-sm">{t("aiSettings.subscribeToGrade")}</Typography>
                                            </Tooltip.Content>
                                        </Tooltip>
                                    </DropdownItem>
                                )
                            }
                            if (belowFloor) {
                                // WARNING: dưới mức khuyến nghị — vẫn chọn được nhưng có thể chấm KHÔNG chính xác.
                                return (
                                    <DropdownItem
                                        key={key}
                                        textValue={model.model}
                                        onPress={() => onSelect({
                                            mode: canPremium ? AiMode.Premium : AiMode.Auto,
                                            model: model.model,
                                            provider: model.provider,
                                        })}
                                    >
                                        <Tooltip>
                                            <Tooltip.Trigger>
                                                <div className="flex w-full items-center justify-between gap-2">
                                                    <span className="flex min-w-0 items-center gap-2">
                                                        <WarningIcon className="size-5 shrink-0 text-warning" />
                                                        <span className="truncate">{model.model}</span>
                                                    </span>
                                                    {categoryChip}
                                                </div>
                                            </Tooltip.Trigger>
                                            <Tooltip.Content>
                                                <Typography type="body-sm" className="text-warning">
                                                    {t("aiSettings.belowFloorWarning")}
                                                </Typography>
                                            </Tooltip.Content>
                                        </Tooltip>
                                    </DropdownItem>
                                )
                            }
                            return (
                                <DropdownItem
                                    key={key}
                                    textValue={model.model}
                                    onPress={() => onSelect({
                                        mode: canPremium ? AiMode.Premium : AiMode.Auto,
                                        model: model.model,
                                        provider: model.provider,
                                    })}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate">{model.model}</span>
                                        {categoryChip}
                                    </div>
                                </DropdownItem>
                            )
                        })}
                    </DropdownSection>
                </DropdownMenu>
            </DropdownPopover>
        </Dropdown>
    )
}
