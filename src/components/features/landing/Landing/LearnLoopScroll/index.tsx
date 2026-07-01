"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button, ListBox, Typography, cn } from "@heroui/react"
import {
    AnimatePresence,
    motion,
    useMotionValueEvent,
    useReducedMotion,
    useScroll,
} from "framer-motion"
import { useTranslations } from "next-intl"
import {
    ArrowRightIcon,
    ArrowUpIcon,
    BookOpenIcon,
    CheckCircleIcon,
    GithubLogoIcon,
    PlayCircleIcon,
    RobotIcon,
    RocketLaunchIcon,
    TrophyIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { useSmViewpoint } from "@/hooks/reuseables/useSmViewpoint"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { LANDING_LOOP_STEPS } from "../constants"
import { SectionHeading } from "@/components/blocks/marketing/SectionHeading"
import { ShowcaseMockup, SHOWCASE_THEMES } from "@/components/blocks/marketing/ShowcaseMockup"

/** Props for {@link LearnLoopScroll}. */
export type LearnLoopScrollProps = WithClassNames<undefined>

/** Icon cho từng bước của vòng học (keys khớp `landing.learnLoop.items.{key}`). */
const STEP_ICONS: Record<string, React.ReactNode> = {
    read: <BookOpenIcon aria-hidden focusable="false" />,
    grade: <RobotIcon aria-hidden focusable="false" />,
    capstone: <RocketLaunchIcon aria-hidden focusable="false" />,
    rank: <TrophyIcon aria-hidden focusable="false" />,
}

/** Address-bar của từng panel (đọc như màn hình thật của sản phẩm). */
const STEP_URL: Record<string, string> = {
    read: "starci.academy/learn/dead-letter-queue",
    grade: "starci.academy/submit",
    capstone: "starci.academy/capstone/the-shop",
    rank: "starci.academy/leaderboard",
}

/**
 * Bài đọc minh hoạ bước "Đọc" — CÙNG một bài (Dead Letter Queue) viết ở 4 ngôn ngữ.
 * Mỗi tab đổi tên file + code; bấm để chuyển. Code cố ý "sâu" hơn 1 dòng cho thật.
 */
const READ_LESSON = [
    {
        label: "TS",
        file: "order-consumer.ts",
        code: `// retry; quá ngưỡng → DLQ
async function onMessage(msg: Message) {
  try { await handle(msg); await msg.ack() }
  catch {
    if (msg.attempts >= MAX) await dlq.send(msg.body)
    else await msg.nack()
  }
}`,
    },
    {
        label: "Java",
        file: "OrderConsumer.java",
        code: `// retry; quá ngưỡng → DLQ
void onMessage(Message msg) {
  try { handle(msg); msg.ack(); }
  catch (Exception e) {
    if (msg.attempts() >= MAX) dlq.send(msg.body());
    else msg.nack();
  }
}`,
    },
    {
        label: "C#",
        file: "OrderConsumer.cs",
        code: `// retry; quá ngưỡng → DLQ
async Task OnMessage(Message msg) {
  try { await Handle(msg); await msg.AckAsync(); }
  catch (Exception e) {
    if (msg.Attempts >= Max) await dlq.SendAsync(msg.Body);
    else await msg.NackAsync();
  }
}`,
    },
    {
        label: "Go",
        file: "consumer.go",
        code: `func onMessage(msg Message) {
  err := handle(msg)
  if err == nil { msg.Ack(); return }
  if msg.Attempts >= Max { dlq.Send(msg.Body) } else { msg.Nack() }
}`,
    },
] as const

/** Token cho tint code (comment · string · keyword) — đủ cho demo, không phải full lexer. */
const CODE_TOKEN = /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*")|\b(const|let|var|async|await|function|func|return|if|else|for|class|public|private|static|void|new|using|namespace|package|import|from|type|struct|interface|defer|throw|catch|try|final|int|Task|Exception|nil|err)\b/g

/** Tô màu 1 dòng code: comment → muted · string → warning · keyword → accent. */
const tintLine = (line: string): React.ReactNode => {
    if (line === "") {
        return " "
    }
    const out: React.ReactNode[] = []
    let last = 0
    let key = 0
    let match: RegExpExecArray | null
    CODE_TOKEN.lastIndex = 0
    while ((match = CODE_TOKEN.exec(line)) !== null) {
        if (match.index > last) {
            out.push(line.slice(last, match.index))
        }
        const token = match[0]
        const cls = match[1] ? "text-muted" : match[2] ? "text-warning" : "text-accent"
        out.push(<span key={key++} className={cls}>{token}</span>)
        last = match.index + token.length
    }
    if (last < line.length) {
        out.push(line.slice(last))
    }
    return out
}

/** Khối code có số dòng + tint (mono). */
const CodeBlock = ({ code }: { code: string }) => {
    const lines = code.split("\n")
    return (
        <div className="flex font-mono text-xs leading-relaxed">
            <div aria-hidden className="flex flex-col items-end gap-1.5 border-r border-default/70 px-3 py-4 text-muted/60 select-none">
                {lines.map((_, index) => <span key={index}>{index + 1}</span>)}
            </div>
            <div className="flex flex-col gap-1.5 overflow-x-auto px-4 py-4">
                {lines.map((line, index) => <span key={index} className="whitespace-pre">{tintLine(line)}</span>)}
            </div>
        </div>
    )
}

/** Bảng xếp hạng minh hoạ (marketing, không phải data thật). */
const RANK_ROWS = [
    { rank: 1, name: "minh.dev", xp: 4280 },
    { rank: 2, name: "huyen.codes", xp: 2715 },
    { rank: 3, name: "thanh.io", xp: 1940 },
] as const

/**
 * Visual cột phải đổi theo bước — flat, dựng bằng token (không ảnh thật), mỗi panel
 * neo bằng icon của bước. Bốn panel: Đọc (tab 4 ngôn ngữ + code tint) · Chấm AI (score
 * ring + tiêu chí pass/warn) · Capstone (mini sơ đồ kiến trúc) · Bảng xếp hạng (medal +
 * avatar + thanh XP + dòng "Bạn"). Phần tử trong panel vào sân theo stagger nhẹ.
 */
const StepVisual = ({ stepKey }: { stepKey: string }) => {
    const t = useTranslations()
    const reduce = useReducedMotion()
    // ngôn ngữ đang chọn ở bước "Đọc" (tab bấm được; reset khi panel re-mount)
    const [readLang, setReadLang] = useState(0)

    const childVariants = reduce
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }
    const stagger = {
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : 0.07, delayChildren: reduce ? 0 : 0.05 } },
    }

    // Panel phải = block LabeledCard (label NGOÀI: icon bước + title · tag bên phải). Body
    // = visual của bước + 1 dòng mô tả (mỗi card "nói" thêm, không trơ visual). Stagger nhẹ.
    const shell = (children: React.ReactNode, align: "center" | "start" = "center") => (
        <ShowcaseMockup
            url={STEP_URL[stepKey]}
            aspect="video"
            tilt="left"
            backdrop="glow"
            theme={SHOWCASE_THEMES.starci}
            contentClassName={cn("flex flex-col p-4", align === "start" ? "justify-start" : "justify-center")}
        >
            <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-3"
            >
                {children}
            </motion.div>
        </ShowcaseMockup>
    )

    if (stepKey === "read") {
        return shell(
            <>
                <motion.div variants={childVariants} className="flex flex-wrap gap-4 border-b border-default text-xs">
                    {READ_LESSON.map((item, index) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => setReadLang(index)}
                            aria-pressed={index === readLang}
                            className={cn(
                                "-mb-px cursor-pointer border-b-2 pb-2 transition-colors",
                                index === readLang
                                    ? "border-accent font-medium text-accent"
                                    : "border-transparent text-muted hover:text-foreground",
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </motion.div>
                <motion.div variants={childVariants} className="overflow-hidden rounded-xl border border-default bg-default">
                    <div className="border-b border-default/70 px-3 py-1.5">
                        <span className="font-mono text-xs text-muted">{READ_LESSON[readLang].file}</span>
                    </div>
                    <CodeBlock code={READ_LESSON[readLang].code} />
                </motion.div>
            </>,
            "start",
        )
    }

    if (stepKey === "grade") {
        const criteria = [
            { ok: true, text: "Idempotency key xử lý đúng.", pts: "+30" },
            { ok: true, text: "Retry + backoff hợp lý.", pts: "+25" },
            { ok: false, text: "Thiếu rate-limit ở gateway.", pts: "−8" },
        ]
        return shell(
            <>
                {/* verdict = HeroUI Alert style (đúng SubmissionResult): tint success + icon + điểm */}
                <motion.div variants={childVariants} className="flex items-center gap-3 rounded-xl bg-success/10 px-3 py-2.5">
                    <CheckCircleIcon weight="fill" aria-hidden focusable="false" className="size-7 shrink-0 text-success" />
                    <div className="flex flex-1 flex-col">
                        <span className="text-sm font-semibold text-success">{t("submissionResult.passed")} · 92/100</span>
                        <span className="text-xs text-success/80">cần ≥ 70 để qua</span>
                    </div>
                    <span className="shrink-0 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">+120 XP</span>
                </motion.div>
                <motion.div variants={childVariants} className="flex flex-col gap-1.5">
                    {criteria.map((item) => (
                        <span key={item.text} className="flex items-center gap-2 text-sm text-muted">
                            {item.ok ? (
                                <CheckCircleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-success" />
                            ) : (
                                <WarningCircleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-warning" />
                            )}
                            <span className="flex-1">{item.text}</span>
                            <span className={cn("shrink-0 font-medium", item.ok ? "text-success" : "text-warning")}>{item.pts}</span>
                        </span>
                    ))}
                </motion.div>
            </>,
        )
    }

    if (stepKey === "capstone") {
        const milestones = [
            { label: "Dựng khung & CI", state: "done" },
            { label: "Auth + API Gateway", state: "done" },
            { label: "Tách service · DB-per-service", state: "active" },
        ] as const
        return shell(
            <>
                <motion.div variants={childVariants} className="flex items-center justify-between">
                    <span className="font-mono text-sm font-medium">the-shop</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                        <GithubLogoIcon aria-hidden focusable="false" className="size-3.5" />
                        main
                    </span>
                </motion.div>
                <motion.div variants={childVariants} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs text-muted">
                        <span>Tiến độ</span>
                        <span>8/20 chặng · 40%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-default">
                        <div className="h-full rounded-full bg-accent" style={{ width: "40%" }} />
                    </div>
                </motion.div>
                <motion.div variants={childVariants} className="flex flex-col gap-1.5">
                    {milestones.map((item) => (
                        <span key={item.label} className="flex items-center gap-2 text-sm">
                            {item.state === "done" ? (
                                <CheckCircleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-success" />
                            ) : (
                                <PlayCircleIcon aria-hidden focusable="false" className="size-4 shrink-0 text-accent" />
                            )}
                            <span className={cn("flex-1", item.state === "active" ? "font-medium text-foreground" : "text-muted")}>
                                {item.label}
                            </span>
                        </span>
                    ))}
                </motion.div>
            </>,
        )
    }

    // rank
    const maxXp = RANK_ROWS[0].xp
    return shell(
        <motion.div variants={childVariants} className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Tuần này</span>
                <span className="text-xs text-muted">XP tích luỹ</span>
            </div>
            {RANK_ROWS.map((row) => (
                <div key={row.rank} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className={cn("w-5 text-center text-sm font-semibold", row.rank === 1 ? "text-accent" : "text-muted")}>
                            {row.rank}
                        </span>
                        <UserAvatar className="size-7" username={row.name} seed={row.name} />
                        <span className="flex-1 truncate text-sm">{row.name}</span>
                        <span className={cn("text-sm", row.rank === 1 ? "font-semibold text-accent" : "text-muted")}>
                            {row.xp.toLocaleString("vi-VN")}
                        </span>
                    </div>
                    <div className="ml-7 h-1.5 overflow-hidden rounded-full bg-default">
                        <div
                            className={cn("h-full rounded-full", row.rank === 1 ? "bg-accent" : "bg-accent/40")}
                            style={{ width: `${(row.xp / maxXp) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
            <div className="mt-1 flex items-center gap-2 rounded-xl bg-accent/10 px-3 py-2">
                <span className="w-5 text-center text-sm font-semibold text-accent">12</span>
                <UserAvatar className="size-7" username="Bạn" seed="ban-viewer" />
                <span className="flex-1 truncate text-sm text-accent">Bạn</span>
                <span className="flex items-center gap-1 text-xs text-success">
                    <ArrowUpIcon aria-hidden focusable="false" className="size-3" />3
                </span>
            </div>
        </motion.div>,
    )
}

/** Thẻ bước cho layout tĩnh (fallback mobile / reduced-motion). */
/**
 * Danh sách 4 bước (ListBox) dùng chung cho cả 2 biến thể. `active` = bước đang chọn;
 * bấm 1 bước → `onSelect(index)` (pinned: cuộn tới đúng bước · static: set active trực
 * tiếp). done (index < active) hiện check xanh; active = accent.
 */
const LoopStepList = ({ active, onSelect }: { active: number; onSelect: (index: number) => void }) => {
    const t = useTranslations()
    const activeKey = LANDING_LOOP_STEPS[active]
    return (
        <ListBox
            aria-label={t("landing.learnLoop.title")}
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[activeKey]}
            onSelectionChange={(keys) => {
                const key = [...keys][0]
                const index = LANDING_LOOP_STEPS.findIndex((step) => step === key)
                if (index >= 0) {
                    onSelect(index)
                }
            }}
            className="gap-1 p-0"
        >
            {LANDING_LOOP_STEPS.map((key, index) => {
                const selected = key === activeKey
                const done = index < active
                const stepColor = cn(
                    "transition-colors group-data-[hovered=true]:text-accent",
                    done ? "text-success" : selected ? "text-accent" : "text-muted",
                )
                return (
                    <ListBox.Item
                        key={key}
                        id={key}
                        textValue={t(`landing.learnLoop.items.${key}.title`)}
                        className={cn(
                            "group cursor-pointer rounded-xl px-4 py-2.5 transition-colors data-[hovered=true]:bg-accent/10",
                            selected && "bg-accent/10",
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <span className={cn("[&>svg]:size-5", stepColor)}>
                                {done ? (
                                    <CheckCircleIcon aria-hidden focusable="false" className="size-5" />
                                ) : (
                                    STEP_ICONS[key]
                                )}
                            </span>
                            <Typography type="body" className="text-foreground">
                                {t(`landing.learnLoop.items.${key}.title`)}
                            </Typography>
                        </div>
                    </ListBox.Item>
                )
            })}
        </ListBox>
    )
}

/** Visual panel đổi theo bước (crossfade) — dùng chung cho cả 2 biến thể. */
const LoopPanel = ({ activeKey }: { activeKey: string }) => (
    <div className="relative min-h-[320px]">
        <AnimatePresence mode="wait">
            <motion.div
                key={activeKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
            >
                <StepVisual stepKey={activeKey} />
            </motion.div>
        </AnimatePresence>
    </div>
)

/** Heading dùng chung cho cả 2 biến thể (tĩnh + pinned). */
const LoopHeading = () => {
    const t = useTranslations()
    // CTA "vào cày thử" — cuộn xuống khối Lộ trình (#courses) để chọn track + học thử.
    const onJumpIn = () => document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" })
    return (
        <div className="flex flex-col items-center gap-6">
            <SectionHeading
                eyebrow={t("landing.learnLoop.eyebrow")}
                title={t("landing.learnLoop.title")}
                intro={t("landing.learnLoop.intro")}
            />
            <Button variant="primary" size="lg" onPress={onJumpIn}>
                {t("landing.learnLoop.cta")}
                <ArrowRightIcon aria-hidden focusable="false" className="size-5" />
            </Button>
        </div>
    )
}

/**
 * Layout CLICK-DRIVEN (mobile / reduced-motion / trước mount) — list bấm được + panel
 * đổi theo bước, KHÔNG scroll-hijack. Cùng list+panel với pinned, chỉ khác: bấm 1 bước
 * = set active trực tiếp (không cuộn). Mobile: list trên · panel dưới (1 cột).
 */
const LearnLoopStatic = ({ className }: LearnLoopScrollProps) => {
    const [active, setActive] = useState(0)
    return (
        <section className={cn("flex flex-col gap-16", className)}>
            <LoopHeading />
            <div className="grid grid-cols-1 items-center gap-x-12 gap-y-12 lg:grid-cols-2 lg:gap-y-20">
                <div>
                    <LoopStepList active={active} onSelect={setActive} />
                </div>
                <LoopPanel activeKey={LANDING_LOOP_STEPS[active]} />
            </div>
        </section>
    )
}

/**
 * Biến thể PINNED (desktop) — tách riêng để `useScroll`'s target ref LUÔN gắn vào
 * `<section>` được render (tránh "Target ref defined but not hydrated" khi nhánh
 * fallback không gắn ref). Ghim khối giữa màn; cuộn → bước active 01→04 + visual phải
 * đổi + thanh tiến độ; cuộn hết → `sticky` nhả. Bấm bước ở ListBox → cuộn tới đúng đó.
 */
const LearnLoopPinned = ({ className }: LearnLoopScrollProps) => {
    const sectionRef = useRef<HTMLDivElement>(null)
    const [active, setActive] = useState(0)

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"],
    })
    useMotionValueEvent(scrollYProgress, "change", (value) => {
        const last = LANDING_LOOP_STEPS.length - 1
        const index = Math.min(last, Math.max(0, Math.round(value * last)))
        setActive(index)
    })

    /** Cuộn cửa sổ tới vị trí ứng với bước `index` (khi bấm ListBox). */
    const jumpToStep = (index: number) => {
        const element = sectionRef.current
        if (!element) {
            return
        }
        const last = LANDING_LOOP_STEPS.length - 1
        const fraction = last > 0 ? index / last : 0
        const start = element.getBoundingClientRect().top + window.scrollY
        const distance = element.offsetHeight - window.innerHeight
        window.scrollTo({ top: start + fraction * distance, behavior: "smooth" })
    }

    const activeKey = LANDING_LOOP_STEPS[active]

    return (
        <section ref={sectionRef} className={cn("relative h-[360vh]", className)}>
            <div className="sticky top-0 flex h-screen flex-col justify-center gap-16 py-12">
                <LoopHeading />
                <div className="grid grid-cols-1 items-center gap-x-12 gap-y-12 lg:grid-cols-2 lg:gap-y-20">
                    {/* TRÁI — list 4 bước (scroll lái active; bấm → cuộn tới). PHẢI — visual đổi. */}
                    <div>
                        <LoopStepList active={active} onSelect={jumpToStep} />
                    </div>
                    <LoopPanel activeKey={activeKey} />
                </div>
            </div>
        </section>
    )
}

/**
 * Section "Cách học" (vòng học 4 bước). Desktop (sau mount, không reduced-motion) →
 * {@link LearnLoopPinned} (scroll-pinned giống ika.xyz). Mobile / reduced-motion /
 * trước khi mount → {@link LearnLoopStatic} (4 thẻ tĩnh, không scroll-hijack + a11y).
 * Tách 2 biến thể để `useScroll` (trong Pinned) chỉ chạy khi `<section ref>` thật sự
 * render — tránh lỗi "Target ref defined but not hydrated".
 *
 * @param props - optional className (placement only).
 */
export const LearnLoopScroll = ({ className }: LearnLoopScrollProps) => {
    const reduce = useReducedMotion()
    const { isDesktop } = useSmViewpoint()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    if (!mounted || !isDesktop || reduce) {
        return <LearnLoopStatic className={className} />
    }
    return <LearnLoopPinned className={className} />
}
