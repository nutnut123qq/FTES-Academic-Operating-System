## Context
Course = a course you buy → enroll → learn. The detail page is the sales surface.
Direction A was chosen with the teacher (2026-07-02) over a single-column variant B.

## Goals / Non-Goals
**Goals:** two-column sales layout, sticky enroll card, syllabus preview with
durations, reviews + instructor, VND-primary price, build green, FE mock.
**Non-Goals:** real payment/enroll, gated content unlocking, real reviews, video.

## Decisions
- **Archetype:** detail two-column — `grid md:grid-cols-5`, left `col-span-3`
  (scrolling content), right `col-span-2` (`md:sticky md:top-20` enroll card).
- **Enroll card = plain bordered panel** (`rounded-large border border-separator`),
  matching the course feature's existing hand-rolled card idiom in this repo.
- **Price = `PriceTag` block** (VND, size lg, struck original) + a muted USD line —
  reuses the discount logic; USD stays a reference figure.
- **Syllabus = hand-rolled expandable** (first chapter open). ponytail: swap to the
  HeroUI Accordion once its v3 API is confirmed in this stripped repo.
- **CTA = enroll**, routes to `/courses/[id]/enroll` (rule premium-unlock-is-enroll).

## Risks / Trade-offs
- Mock data; enroll/try CTAs no-op — logged with ponytail markers.
- Hand-rolled accordion instead of HeroUI Accordion — deliberate, build-safety.
- Mock `durationLabel` ("6 giờ") is Vietnamese literal, so the EN includes-row reads
  slightly mixed — a mock-data artifact, resolves when BE supplies localized data.
