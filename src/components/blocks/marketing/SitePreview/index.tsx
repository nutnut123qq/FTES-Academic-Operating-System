import React from "react"
import { cn } from "@heroui/react"
import { CheckCircleIcon, StarIcon } from "@phosphor-icons/react"

/** Một khoá trong list preview (minh hoạ marketing, không phải data thật). */
interface PreviewCourse {
    initial: string
    name: string
    level: string
    rating: string
    price: string
    tone: "accent" | "success" | "warning"
}

const COURSES: ReadonlyArray<PreviewCourse> = [
    { initial: "FS", name: "Fullstack Mastery", level: "Trung cấp", rating: "4.9", price: "1.290k", tone: "accent" },
    { initial: "SD", name: "System Design", level: "Nâng cao", rating: "5.0", price: "1.490k", tone: "success" },
    { initial: "DO", name: "DevOps Mastery", level: "Nâng cao", rating: "4.8", price: "1.390k", tone: "warning" },
]

const TONE_TILE: Record<PreviewCourse["tone"], string> = {
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
}

/** 1 dòng filter có ô tick (checked = accent). */
const FilterRow = ({ label, on }: { label: string; on?: boolean }) => (
    <span className="flex items-center gap-2 text-muted">
        <span
            className={cn(
                "flex size-3.5 shrink-0 items-center justify-center rounded border",
                on ? "border-accent bg-accent text-accent-foreground" : "border-default",
            )}
        >
            {on ? <CheckCircleIcon weight="bold" aria-hidden focusable="false" className="size-2.5" /> : null}
        </span>
        {label}
    </span>
)

/**
 * Preview 1 trang web (kiểu catalog tìm khoá học) — header nav + sidebar bộ lọc + list
 * khoá có rating/giá. Token-aware (`bg-surface`/`border-default`/`text-foreground`…) nên
 * đọc tốt cả light/dark. Lấp đầy chiều cao cha (dùng trong `ShowcaseMockup aspect="video"`).
 * Nội dung là minh hoạ marketing, không phải data thật.
 */
export const SitePreview = () => (
    <div className="flex h-full flex-col bg-surface text-foreground">
        {/* app nav */}
        <div className="flex shrink-0 items-center justify-between border-b border-default px-4 py-2.5">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-semibold">
                    <span aria-hidden className="size-3.5 rounded-md bg-accent" />
                    FTES AOS
                </span>
                <span className="hidden items-center gap-3 text-xs text-muted sm:flex">
                    <span className="text-foreground">Khóa học</span>
                    <span>Lộ trình</span>
                    <span>Bảng giá</span>
                </span>
            </div>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">Đăng ký</span>
        </div>

        {/* body: sidebar filter + list khoá */}
        <div className="flex min-h-0 flex-1">
            <div className="hidden w-1/3 max-w-[180px] shrink-0 flex-col gap-3 border-r border-default p-3 text-xs sm:flex">
                <div className="flex flex-col gap-1.5">
                    <span className="font-medium text-muted">Chủ đề</span>
                    <FilterRow label="Fullstack" on />
                    <FilterRow label="System Design" />
                    <FilterRow label="DevOps" />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="font-medium text-muted">Hình thức</span>
                    <FilterRow label="Tự học" on />
                    <FilterRow label="Có mentor" />
                </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden p-3">
                {COURSES.map((course) => (
                    <div
                        key={course.name}
                        className="flex items-center gap-3 rounded-xl border border-default bg-surface px-3 py-2"
                    >
                        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold", TONE_TILE[course.tone])}>
                            {course.initial}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="flex items-center gap-1 truncate text-sm font-medium">
                                {course.name}
                                <CheckCircleIcon weight="fill" aria-hidden focusable="false" className="size-3.5 shrink-0 text-success" />
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted">
                                <StarIcon weight="fill" aria-hidden focusable="false" className="size-3 text-warning" />
                                {course.rating} · {course.level}
                            </span>
                        </div>
                        <div className="shrink-0 text-right">
                            <span className="block text-sm font-semibold text-accent">{course.price}</span>
                            <span className="block text-[10px] text-muted">/ khóa</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
)
