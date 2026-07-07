"use client"

import React from "react"
import {
    Breadcrumbs,
    Typography,
} from "@heroui/react"
import {
    BankIcon,
    BookOpenIcon,
    BuildingsIcon,
    CheckCircleIcon,
    ClipboardTextIcon,
    DesktopIcon,
    DotsThreeIcon,
    EnvelopeSimpleIcon,
    MapPinIcon,
    PencilSimpleIcon,
    PhoneIcon,
    QrCodeIcon,
    QuestionIcon,
    UserCircleIcon,
    WalletIcon,
} from "@phosphor-icons/react"
import type { Icon } from "@phosphor-icons/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    pathConfig,
} from "@/resources/path"
import {
    PRIVACY_LAST_UPDATED,
    PRIVACY_POLICY,
    TERMS_LAST_UPDATED,
    TERMS_OF_SERVICE,
} from "../content"
import type {
    LegalSection,
} from "../content"
import { Callout } from "@/components/blocks/feedback/Callout"
import { PageContainer } from "@/components/blocks/layout/PageContainer"
import { PageHeader } from "@/components/blocks/layout/PageHeader"

/** Which legal document this page renders. */
export type LegalKind = "terms" | "privacy"

/** Props for {@link LegalPage}. */
export interface LegalPageProps {
    /** Selects the legal document (and its `legal.*` header copy) to render. */
    kind: LegalKind
}

/**
 * Icon-key → Phosphor icon map. Content files stay pure data (a small string key);
 * the renderer owns the JSX/import. Unknown/absent keys render no icon.
 */
const ICONS: Record<string, Icon> = {
    qr: QrCodeIcon,
    bank: BankIcon,
    wallet: WalletIcon,
    person: UserCircleIcon,
    learning: BookOpenIcon,
    technical: DesktopIcon,
    other: DotsThreeIcon,
    edit: PencilSimpleIcon,
    "no-marketing": EnvelopeSimpleIcon,
    explain: QuestionIcon,
    benefit: CheckCircleIcon,
    responsibility: ClipboardTextIcon,
}

/** Bullet list — items may carry a bold lead label. */
const ItemList = ({ items }: { items: NonNullable<LegalSection["items"]> }) => (
    <ul className="flex flex-col gap-2">
        {items.map((item) => (
            <li key={item.label ?? item.text} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted" aria-hidden />
                <Typography type="body" color="muted" className="leading-relaxed">
                    {item.label ? (
                        <span className="font-semibold text-foreground">{`${item.label} `}</span>
                    ) : null}
                    {item.text}
                </Typography>
            </li>
        ))}
    </ul>
)

/** Term-anchored glossary: bold term, muted definition, optional italic example line. */
const DefinitionList = ({ definitions }: { definitions: NonNullable<LegalSection["definitions"]> }) => (
    <ul className="flex flex-col gap-3">
        {definitions.map((entry) => (
            <li key={entry.term} className="flex flex-col gap-2 border-l-2 border-accent/40 pl-4">
                <Typography type="body" color="muted" className="leading-relaxed">
                    <span className="font-semibold text-foreground">{`${entry.term} — `}</span>
                    {entry.definition}
                </Typography>
                {entry.example ? (
                    <Typography type="body-sm" color="muted" className="italic leading-relaxed">
                        {entry.example}
                    </Typography>
                ) : null}
            </li>
        ))}
    </ul>
)

/** Responsive card grid — icon + label + text per card. */
const CardGrid = ({ cards }: { cards: NonNullable<LegalSection["cards"]> }) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
            const Ico = card.icon ? ICONS[card.icon] : undefined
            return (
                <div key={card.label} className="flex flex-col gap-2 rounded-2xl border border-default p-4">
                    {Ico ? <Ico className="size-5 text-accent" weight="duotone" aria-hidden /> : null}
                    <Typography type="body" weight="semibold" className="text-foreground">
                        {card.label}
                    </Typography>
                    <Typography type="body-sm" color="muted" className="leading-relaxed">
                        {card.text}
                    </Typography>
                </div>
            )
        })}
    </div>
)

/** Ordered list rendered with accent number badges. */
const StepList = ({ steps }: { steps: NonNullable<LegalSection["steps"]> }) => (
    <ol className="flex flex-col gap-3">
        {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
                    {index + 1}
                </span>
                <Typography type="body" color="muted" className="leading-relaxed">
                    {step}
                </Typography>
            </li>
        ))}
    </ol>
)

/** Bordered company contact panel. */
const ContactPanel = ({ contact }: { contact: NonNullable<LegalSection["contact"]> }) => (
    <div className="flex flex-col gap-2 rounded-2xl border border-default p-4">
        <div className="flex items-center gap-2">
            <BuildingsIcon className="size-5 shrink-0 text-accent" weight="duotone" aria-hidden />
            <Typography type="body" weight="semibold" className="text-foreground">
                {contact.company}
            </Typography>
        </div>
        <div className="flex items-start gap-2">
            <MapPinIcon className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
            <Typography type="body-sm" color="muted" className="leading-relaxed">
                {contact.address}
            </Typography>
        </div>
        <div className="flex items-center gap-2">
            <PhoneIcon className="size-5 shrink-0 text-muted" aria-hidden />
            <Typography type="body-sm" color="muted">
                {contact.phone}
            </Typography>
        </div>
    </div>
)

/**
 * Renders one numbered section: heading + any declared blocks in a stable order —
 * paragraphs, bullet list, callout, definitions, card grid, numbered steps, contact
 * panel, then nested subsections (recursed with a smaller heading). Plain Typography —
 * no markdown. Every block is `?`-guarded, so a section shows only what it declares.
 */
const Section = ({ section, level = 4 }: { section: LegalSection; level?: 4 | 5 }) => (
    <section className="flex flex-col gap-3">
        <Typography.Heading level={level} weight="semibold">{section.heading}</Typography.Heading>
        {section.paragraphs?.map((paragraph) => (
            <Typography key={paragraph} type="body" color="muted" className="leading-relaxed">
                {paragraph}
            </Typography>
        ))}
        {section.items ? <ItemList items={section.items} /> : null}
        {section.callout ? (
            <Callout
                status={section.callout.tone ?? "warning"}
                title={section.callout.title}
                description={section.callout.text}
            />
        ) : null}
        {section.definitions ? <DefinitionList definitions={section.definitions} /> : null}
        {section.cards ? <CardGrid cards={section.cards} /> : null}
        {section.steps ? <StepList steps={section.steps} /> : null}
        {section.contact ? <ContactPanel contact={section.contact} /> : null}
        {section.subsections?.map((sub) => (
            <Section key={sub.heading} section={sub} level={5} />
        ))}
    </section>
)

/**
 * Shared legal document page (`/terms`, `/privacy`): a reading column —
 * breadcrumb → `PageHeader` (title + description + last-updated) → the document
 * rendered NATIVELY from structured content (numbered sections that may mix
 * paragraphs, bullet lists, callouts, definitions, card grids, numbered steps,
 * a contact panel, and nested subsections) with Typography. No markdown. Document
 * picked by `kind` + the active locale (falls back to `vi`); copy lives in
 * `legal/content/{privacy,terms}.ts`.
 *
 * @param props - {@link LegalPageProps}
 */
export const LegalPage = ({ kind }: LegalPageProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const docs = kind === "privacy" ? PRIVACY_POLICY : TERMS_OF_SERVICE
    const doc = docs[locale] ?? docs.vi
    const lastUpdatedIso = kind === "privacy" ? PRIVACY_LAST_UPDATED : TERMS_LAST_UPDATED
    // local-midnight parse avoids a timezone day-shift; localized long date
    const lastUpdated = new Date(`${lastUpdatedIso}T00:00:00`).toLocaleDateString(
        locale === "vi" ? "vi-VN" : "en-GB",
        { day: "numeric", month: "long", year: "numeric" },
    )
    return (
        <PageContainer>
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
                <PageHeader
                    breadcrumb={(
                        <Breadcrumbs>
                            <Breadcrumbs.Item onPress={() => router.push(pathConfig().locale().build())}>
                                {t("nav.home")}
                            </Breadcrumbs.Item>
                            <Breadcrumbs.Item>
                                {t(`legal.${kind}.title`)}
                            </Breadcrumbs.Item>
                        </Breadcrumbs>
                    )}
                    title={t(`legal.${kind}.title`)}
                    description={t(`legal.${kind}.description`)}
                    meta={(
                        <Typography type="body-xs" color="muted">
                            {t("legal.lastUpdated", { date: lastUpdated })}
                        </Typography>
                    )}
                />
                <div className="flex flex-col gap-6">
                    <Typography type="body" className="leading-relaxed">
                        {doc.intro}
                    </Typography>
                    {doc.sections.map((section) => (
                        <Section key={section.heading} section={section} />
                    ))}
                </div>
            </div>
        </PageContainer>
    )
}
