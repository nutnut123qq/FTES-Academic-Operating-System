import React from "react"
import { Accordion, cn, Typography } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** One blunt truth + how the product answers it. */
export interface TruthListItem {
    /** The uncomfortable truth (the headline statement). */
    truth: React.ReactNode
    /** What we do about it (the proof line — keep it concrete). */
    fix: React.ReactNode
}

/** Props for the {@link TruthList} block. */
export interface TruthListProps extends WithClassNames<undefined> {
    /** Ordered truths — each a broken industry reality + the product's answer. */
    items: Array<TruthListItem>
    /** Optional signature footer (who is saying this) — e.g. a founder byline. */
    byline?: React.ReactNode
}

/**
 * A "raw truth" manifesto: a list of uncomfortable industry truths, each paired
 * with a concrete "→ here's our answer" line, closed
 * by an optional byline (who's saying it). Built for confrontational, grounded
 * positioning — the truths are the hero, the author recedes to a signature.
 * Tier-3 block on {@link SectionCard}; styling here, content via props.
 *
 * @param props - {@link TruthListProps}
 */
export const TruthList = ({ items, byline, className }: TruthListProps) => {
    return (
        <div className={cn("overflow-hidden rounded-3xl border border-default bg-surface", className)}>
            {/* Accordion Card: khung p-0 flush, accordion surface tự lo nền + separator + bo góc.
                Mỗi sự thật = trigger (statement) bấm mở ra phần giải. KHÔNG Accordion.Indicator
                → không caret (thầy chốt); hover trigger là affordance. */}
            <Accordion variant="surface" className="!rounded-none [&_*]:!rounded-none">
                {/* accordion vuông toàn bộ → khung ngoài (overflow-hidden rounded-3xl) lo bo góc;
                    item cuối flush phẳng với byline, không bo lòi khi hover. */}
                {items.map((item, index) => (
                    <Accordion.Item
                        key={index}
                        aria-label={typeof item.truth === "string" ? item.truth : `truth-${index}`}
                    >
                        <Accordion.Heading>
                            <Accordion.Trigger>
                                <Typography type="body" weight="medium" className="text-left">
                                    {item.truth}
                                </Typography>
                            </Accordion.Trigger>
                        </Accordion.Heading>
                        <Accordion.Panel>
                            <Accordion.Body>
                                <Typography type="body-sm" color="muted">
                                    {item.fix}
                                </Typography>
                            </Accordion.Body>
                        </Accordion.Panel>
                    </Accordion.Item>
                ))}
            </Accordion>
            {byline ? (
                <div className="flex flex-wrap items-center gap-3 border-t border-default px-5 py-4">
                    {byline}
                </div>
            ) : null}
        </div>
    )
}
