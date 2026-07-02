## Why

`/events` was 404 — §14 Event (the event domain) had no surface at all. This ships
the catalog (Phase 1 start), turning `/events` into a real 200 route so learners can
browse upcoming webinars, workshops, hackathons, competitions and meetups.

## What Changes

- Add `features/event/EventCatalog` + `[locale]/events/page.tsx`: text search + type
  filter + grid of event cards linking to each event page. Mirrors the house catalog
  archetype (`SubjectCatalog`).
- Add `useQueryEventsSwr` (mock list of ~6 events, SWR-shaped for a BE swap).
- Add `eventSystem.*` i18n (vi/en): catalog copy, the 5 type labels, attendee count,
  register CTA.

## Capabilities

### New Capabilities
- `event-catalog`: the event catalog at `/events`.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/event/EventCatalog`, `events/page.tsx`, `useQueryEventsSwr`;
  new `eventSystem` i18n keys. No BE (mock). No shared chrome/nav edits in this change.
