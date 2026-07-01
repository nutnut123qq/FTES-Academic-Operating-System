import React from "react"
import { Skeleton as HeroSkeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

import { SkeletonTypography } from "./Typography"
import { SkeletonParagraph } from "./Paragraph"
import { SkeletonInput } from "./Input"
import { SkeletonTextArea } from "./TextArea"
import { SkeletonSelect } from "./Select"
import { SkeletonButton } from "./Button"
import { SkeletonSwitch } from "./Switch"
import { SkeletonCheckbox } from "./Checkbox"
import { SkeletonRadioGroup } from "./RadioGroup"
import { SkeletonSlider } from "./Slider"
import { SkeletonAvatar } from "./Avatar"
import { SkeletonChip } from "./Chip"
import { SkeletonBadge } from "./Badge"
import { SkeletonKbd } from "./Kbd"
import { SkeletonProgressBar } from "./ProgressBar"
import { SkeletonSegmentBar } from "./SegmentBar"
import { SkeletonMeter } from "./Meter"
import { SkeletonCard } from "./Card"
import { SkeletonAccordion } from "./Accordion"
import { SkeletonDisclosure } from "./Disclosure"
import { SkeletonTabs } from "./Tabs"
import { SkeletonBreadcrumbs } from "./Breadcrumbs"
import { SkeletonPagination } from "./Pagination"
import { SkeletonTable } from "./Table"
import { SkeletonListBox } from "./ListBox"
import { SkeletonListRow } from "./ListRow"
import { SkeletonMenu } from "./Menu"
import { SkeletonUserCell } from "./UserCell"
import { SkeletonMetric } from "./Metric"

/** Props for the base {@link Skeleton} bar. */
export type SkeletonBarProps = WithClassNames<undefined>

/**
 * Raw shimmer bar (thin passthrough over the HeroUI Skeleton). Size it via
 * `className` — e.g. `<Skeleton className="h-12 w-full rounded-xl" />`.
 */
const SkeletonBar = ({ className }: SkeletonBarProps) => {
    return <HeroSkeleton className={cn(className)} />
}

/**
 * Skeleton compound — a raw bar plus one placeholder per HeroUI component, each
 * sized to MATCH THE REAL COMPONENT'S BOX (text bars use glyph height centered in
 * the line box: `h-[F] my-[(L-F)/2]`). Build a loading state by MIRRORING the real
 * layout tree: keep structural nodes (Separator, spacer divs, wrappers, gaps) and
 * swap each content node for its `Skeleton.<Component>`. See starci-async.md.
 *
 *   <Skeleton.Typography type="body-sm" /> · <Skeleton.Paragraph lines={3} />
 *   <Skeleton.Input /> · <Skeleton.Avatar size="md" /> · <Skeleton.Accordion items={3} />
 */
export const Skeleton = Object.assign(SkeletonBar, {
    Typography: SkeletonTypography,
    Paragraph: SkeletonParagraph,
    Input: SkeletonInput,
    TextArea: SkeletonTextArea,
    Select: SkeletonSelect,
    Button: SkeletonButton,
    Switch: SkeletonSwitch,
    Checkbox: SkeletonCheckbox,
    RadioGroup: SkeletonRadioGroup,
    Slider: SkeletonSlider,
    Avatar: SkeletonAvatar,
    Chip: SkeletonChip,
    Badge: SkeletonBadge,
    Kbd: SkeletonKbd,
    ProgressBar: SkeletonProgressBar,
    SegmentBar: SkeletonSegmentBar,
    Meter: SkeletonMeter,
    Card: SkeletonCard,
    Accordion: SkeletonAccordion,
    Disclosure: SkeletonDisclosure,
    Tabs: SkeletonTabs,
    Breadcrumbs: SkeletonBreadcrumbs,
    Pagination: SkeletonPagination,
    Table: SkeletonTable,
    ListBox: SkeletonListBox,
    ListRow: SkeletonListRow,
    Menu: SkeletonMenu,
    UserCell: SkeletonUserCell,
    Metric: SkeletonMetric,
})
